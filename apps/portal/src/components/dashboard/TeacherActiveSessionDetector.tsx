"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

// Module-level in-memory flag.
// Survives client-side SPA navigation (so clicking buttons or menu items never repeats the redirect).
// Resets on page reload (F5) or when logging in / switching user.
let hasAutoRedirectedInSession = false;
let lastTrackedUserId: string | null = null;

export function TeacherActiveSessionDetector() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const currentUserId = session?.user?.id ?? null;
  useEffect(() => {
    if (currentUserId && currentUserId !== lastTrackedUserId) {
      lastTrackedUserId = currentUserId;
      hasAutoRedirectedInSession = false;
    }
  }, [currentUserId]);

  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isTeacher = role === "teacher" || permissions.includes("teach");
  const isDashboardRoot = pathname === "/dashboard";

  // Clean any stale session locks from previous test runs
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("brio_attendance_session_dismissed");
      sessionStorage.removeItem("brio_attendance_entry_checked");
    }
  }, []);

  const { data } = trpc.attendance.getTeacherActiveSession.useQuery(undefined, {
    enabled: isTeacher && isDashboardRoot && !hasAutoRedirectedInSession,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    // Only auto-redirect if we are on the dashboard root and the user is a teacher
    if (!isDashboardRoot || !isTeacher) return;
    if (hasAutoRedirectedInSession || !data?.activeSession) return;

    hasAutoRedirectedInSession = true;
    const { groupId, type } = data.activeSession;
    router.push(`/dashboard/attendance?groupId=${groupId}&fullscreen=true&prompt=${type}`);
  }, [data, isDashboardRoot, isTeacher, router]);

  return null;
}
