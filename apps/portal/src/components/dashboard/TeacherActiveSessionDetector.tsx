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
  const canAccessAttendance =
    role === "teacher" ||
    role === "admin" ||
    role === "superadmin" ||
    permissions.includes("teach") ||
    permissions.includes("admin") ||
    permissions.includes("super");

  // If user is already on attendance (/dashboard/attendance), do not auto-redirect
  // (allows manual group choosing from the catalog without unexpected bounces)
  const isAlreadyInAttendance = pathname.startsWith("/dashboard/attendance");

  // Clean any stale session locks from previous test runs
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("brio_attendance_session_dismissed");
      sessionStorage.removeItem("brio_attendance_entry_checked");
    }
  }, []);

  const { data } = trpc.attendance.getTeacherActiveSession.useQuery(undefined, {
    enabled: canAccessAttendance && !isAlreadyInAttendance && !hasAutoRedirectedInSession,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    // If the user is on attendance, mark as handled so leaving it doesn't immediately pull them back
    if (isAlreadyInAttendance) {
      hasAutoRedirectedInSession = true;
      return;
    }

    if (hasAutoRedirectedInSession || !data?.activeSession) return;

    hasAutoRedirectedInSession = true;
    const { groupId, type } = data.activeSession;
    router.push(`/dashboard/attendance?groupId=${groupId}&fullscreen=true&prompt=${type}`);
  }, [data, isAlreadyInAttendance, router]);

  return null;
}
