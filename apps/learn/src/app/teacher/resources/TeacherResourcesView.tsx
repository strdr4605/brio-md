"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TeacherResourceGrid } from "./TeacherResourceGrid";
import { ResourceEmptyState } from "./ResourceEmptyState";
import { ResourcePreviewModal } from "./ResourcePreviewModal";
import { CreateResourceModal } from "./CreateResourceModal";
import { AssignToCourseModal } from "./AssignToCourseModal";
import { EditResourceModal, type EditableResource } from "./EditResourceModal";
import {
  TeacherResourceFilterBar,
  TabType,
  AssignmentStatus,
} from "./TeacherResourceFilterBar";

type ResourceItem = {
  id: number;
  schoolId: number | null;
  title: string;
  description: string | null;
  type: string;
  url: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

export function TeacherResourcesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read filter state from URL (Option D)
  const urlSearch = searchParams.get("q") || "";
  const activeTab = (searchParams.get("type") as TabType) || "all";
  const courseId = searchParams.get("courseId") || "all";
  const status = (searchParams.get("status") as AssignmentStatus) || "all";

  // Local state for smooth typing in search input
  const [search, setSearch] = useState(urlSearch);

  // Modals state
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [assignResource, setAssignResource] = useState<ResourceItem | null>(null);
  const [editingResource, setEditingResource] = useState<EditableResource | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: resources = [], isLoading: isLoadingResources } =
    trpc.resource.getLibraryResources.useQuery({});

  const { data: assignments = [] } =
    trpc.resource.getResourceAssignments.useQuery();

  const { data: courses = [] } = trpc.teacher.getMyCourses.useQuery();

  // Synchronize internal search input if URL changes externally
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  // Update URL helper (Option D)
  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all" || (key === "q" && !value.trim())) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Debounce search update to URL (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== urlSearch) {
        updateFilters({ q: search });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, urlSearch, updateFilters]);

  // Lookup map: resourceId -> Set of courseIds
  const assignmentMap = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const a of assignments) {
      let set = map.get(a.resourceId);
      if (!set) {
        set = new Set<number>();
        map.set(a.resourceId, set);
      }
      set.add(a.courseId);
    }
    return map;
  }, [assignments]);

  // Metrics
  const totalCount = resources.length;
  const worksheetsCount = resources.filter((r) => r.type === "worksheet").length;
  const theoryCount = resources.filter(
    (r) => r.type === "manual" || r.type === "textbook" || r.type === "pdf",
  ).length;
  const interactiveCount = resources.filter(
    (r) =>
      r.type === "minigame" ||
      r.type === "video" ||
      r.type === "vdr" ||
      r.type === "link",
  ).length;

  // Filtered resources based on Type, Status, Course & Search
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      // 1. Tab / Type filter (4 pedagogical categories)
      if (activeTab === "worksheet" && item.type !== "worksheet") return false;
      if (
        activeTab === "theory" &&
        item.type !== "manual" &&
        item.type !== "textbook" &&
        item.type !== "pdf"
      ) {
        return false;
      }
      if (activeTab === "video" && item.type !== "video" && item.type !== "vdr") return false;
      if (activeTab === "minigame" && item.type !== "minigame" && item.type !== "link") return false;

      // 2. Assignment Status filter (Option B)
      const isAssigned = assignmentMap.has(item.id);
      if (status === "assigned" && !isAssigned) return false;
      if (status === "unassigned" && isAssigned) return false;

      // 3. Course filter (Option A)
      if (courseId !== "all") {
        const numericCourseId = parseInt(courseId, 10);
        const assignedCourses = assignmentMap.get(item.id);
        if (!assignedCourses || !assignedCourses.has(numericCourseId)) {
          return false;
        }
      }

      // 4. Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = (item.description || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [resources, activeTab, status, courseId, search, assignmentMap]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    activeTab !== "all" ||
    courseId !== "all" ||
    status !== "all";

  const handleResetFilters = () => {
    setSearch("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="space-y-8">
      {/* Header title & Add Resource action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Biblioteca de Resurse
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explorează, previzualizează și asignează materiale didactice cross-course pe parcursul sesiunilor de curs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer shrink-0"
        >
          <span className="text-base font-bold">+</span>
          <span>Adaugă Resursă</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Resurse"
          value={totalCount}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          footer={<span>Cross-course repository</span>}
        />

        <MetricCard
          title="Fișe & Practică"
          value={worksheetsCount}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          footer={<span>Exerciții & teme didactice</span>}
        />

        <MetricCard
          title="Lectură & Teorie"
          value={theoryCount}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          footer={<span>Manuale & sinteze curs</span>}
        />

        <MetricCard
          title="Video & Jocuri"
          value={interactiveCount}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          footer={<span>Lecții video & minijocuri</span>}
        />
      </div>

      {/* Filter Bar with Course, Status, Type, and Search Controls */}
      <TeacherResourceFilterBar
        search={search}
        onSearchChange={setSearch}
        type={activeTab}
        onTypeChange={(newType) => updateFilters({ type: newType })}
        courseId={courseId}
        onCourseChange={(newCourseId) =>
          updateFilters({
            courseId: newCourseId,
            ...(status === "unassigned" ? { status: "all" } : {}),
          })
        }
        status={status}
        onStatusChange={(newStatus) =>
          updateFilters({
            status: newStatus,
            ...(newStatus === "unassigned" ? { courseId: "all" } : {}),
          })
        }
        courses={courses}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Main Content Area */}
      {isLoadingResources ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 h-64" />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <ResourceEmptyState
          hasFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onOpenCreate={() => setIsCreateOpen(true)}
        />
      ) : (
        <TeacherResourceGrid
          resources={filteredResources}
          assignments={assignments}
          onPreview={(res) => setPreviewResource(res)}
          onUseInCourse={(res) => setAssignResource(res)}
          onEdit={(res) => {
            const firstAssigned = assignments.find((a) => a.resourceId === res.id);
            setEditingResource({
              ...res,
              assignedCourseId: firstAssigned?.courseId || null,
              assignedSessionNumber: firstAssigned?.sessionNumber || null,
              assignedOrderIndex: firstAssigned?.orderIndex ?? 10,
            });
          }}
        />
      )}

      {/* Preview Modal */}
      <ResourcePreviewModal
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
        resource={previewResource}
      />

      {/* Create Resource Modal */}
      <CreateResourceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Assign to Course Modal */}
      <AssignToCourseModal
        isOpen={!!assignResource}
        onClose={() => setAssignResource(null)}
        resource={assignResource}
      />

      {/* Edit Resource Modal */}
      <EditResourceModal
        isOpen={!!editingResource}
        onClose={() => setEditingResource(null)}
        resource={editingResource}
      />
    </div>
  );
}
