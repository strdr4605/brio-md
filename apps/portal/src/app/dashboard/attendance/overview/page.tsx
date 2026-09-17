"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AttendanceOverviewRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/attendance");
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
      Se redirecționează către Istoric Prezență...
    </div>
  );
}
