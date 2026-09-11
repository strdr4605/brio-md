"use client";

import { useState, useEffect } from "react";
import { Nav } from "./Nav";
import { TopHeader } from "./TopHeader";

type DashboardShellProps = {
  children: React.ReactNode;
  userName?: string;
  permissions?: string[];
  role?: string;
  schoolId?: number | null;
};

export function DashboardShell({
  children,
  userName,
  permissions = [],
  role,
  schoolId,
}: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("brio_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("brio_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Nav
        userName={userName}
        permissions={permissions}
        role={role}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"
        }`}
      >
        {/* Top Sticky Header */}
        <TopHeader
          userName={userName}
          role={role}
          schoolId={schoolId}
          onOpenMobileNav={() => setMobileOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-10 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
