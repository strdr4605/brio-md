"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { AttendanceGroupPicker } from "@/components/dashboard/AttendanceGroupPicker";
import { AttendanceJournalTable } from "@/components/dashboard/AttendanceJournalTable";

function AttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";
  const isTeacher = role === "teacher" || permissions.includes("teach");
  const canAccessAttendance = isSuperOrAdmin || isTeacher;

  const urlGroupId = searchParams.get("groupId");
  const isFullscreenParam = searchParams.get("fullscreen") === "true";
  const promptParam = searchParams.get("prompt") as "in_progress" | "uncompleted" | null;

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    urlGroupId ? Number(urlGroupId) : null,
  );

  // Sync state if URL search params change
  useEffect(() => {
    if (urlGroupId) {
      setSelectedGroupId(Number(urlGroupId));
    } else {
      setSelectedGroupId(null);
    }
  }, [urlGroupId]);

  // Fetch groups list for the group picker
  const { data: rawGroupsList = [], isLoading: isGroupsLoading } = trpc.group.list.useQuery(
    undefined,
    { enabled: canAccessAttendance },
  );

  const groupsList = useMemo(() => {
    if (isSuperOrAdmin) return rawGroupsList;
    const currentUserId = Number(session?.user?.id);
    return rawGroupsList.filter((g) => g.teacherId === currentUserId);
  }, [rawGroupsList, isSuperOrAdmin, session?.user?.id]);

  const handleSelectGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
    const fullscreenQuery = isFullscreenParam ? "&fullscreen=true" : "";
    const promptQuery = promptParam ? `&prompt=${promptParam}` : "";
    router.push(`/dashboard/attendance?groupId=${groupId}${fullscreenQuery}${promptQuery}`);
  };

  const handleBackToPicker = () => {
    setSelectedGroupId(null);
    router.push("/dashboard/attendance");
  };

  if (!canAccessAttendance) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nu aveți permisiuni suficiente pentru a accesa catalogul de prezență.
        </p>
      </div>
    );
  }

  // View 1: Gradebook Journal Matrix Table (when group is chosen)
  if (selectedGroupId) {
    return (
      <AttendanceJournalTable
        groupId={selectedGroupId}
        initialFullscreen={isFullscreenParam}
        promptType={promptParam}
        onBackToPicker={handleBackToPicker}
        availableGroups={groupsList}
        onSwitchGroup={handleSelectGroup}
      />
    );
  }

  // View 2: Visual Group Selection Grid
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Catalog Prezență
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Selectează o grupă pentru a deschide catalogul tip școală și a marca prezența în 1-click.
          </p>
        </div>
      </div>

      <AttendanceGroupPicker
        groups={groupsList}
        onSelectGroup={handleSelectGroup}
        isLoading={isGroupsLoading}
        currentUserId={Number(session?.user?.id) || null}
      />
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 animate-pulse">
          <p className="text-sm font-semibold text-slate-400">Se încarcă catalogul...</p>
        </div>
      }
    >
      <AttendanceContent />
    </Suspense>
  );
}
