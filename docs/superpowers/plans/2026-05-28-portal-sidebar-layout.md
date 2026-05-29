# Portal Sidebar + Content Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement mobile-first responsive layout with bottom icon nav on mobile, left sidebar on tablet+.

**Architecture:** Responsive navigation component that switches between fixed bottom bar (mobile) and fixed left sidebar (tablet+). Next.js App Router layout structure with dashboard-specific layout wrapping child pages.

**Tech Stack:** Next.js App Router, Tailwind CSS, TypeScript, next-auth/react

---

## File Structure

```
apps/portal/src/
  app/
    layout.tsx                    # Root layout (existing)
    dashboard/
      layout.tsx                 # NEW: Dashboard layout with nav
      page.tsx                   # Existing - home redirect
      utilizatori/
        page.tsx                 # NEW: Placeholder
      studenti/
        page.tsx                 # NEW: Placeholder
      setari/
        page.tsx                 # NEW: Placeholder
  components/
    providers.tsx                # Existing
    dashboard/
      Nav.tsx                    # NEW: Responsive nav (client)
      Sidebar.tsx               # NEW: Sidebar only (client)
      BottomNav.tsx            # NEW: Bottom nav only (client)
```

---

### Task 1: Create dashboard folder structure

**Files:**

- Create: `apps/portal/src/app/dashboard/utilizatori/page.tsx`
- Create: `apps/portal/src/app/dashboard/studenti/page.tsx`
- Create: `apps/portal/src/app/dashboard/setari/page.tsx`

- [ ] **Step 1: Create utilizatori page**

```tsx
export default function UtilizatoriPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Utilizatori</h1>
      <p className="text-neutral-600">Gestionare utilizatori (în curând)</p>
    </div>
  );
}
```

- [ ] **Step 2: Create studenti page**

```tsx
export default function StudentiPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Studenţi</h1>
      <p className="text-neutral-600">Gestionare studenţi (în curând)</p>
    </div>
  );
}
```

- [ ] **Step 3: Create setari page**

```tsx
export default function SetariPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Setări</h1>
      <p className="text-neutral-600">Setări cont (în curând)</p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/portal/src/app/dashboard/utilizatori/page.tsx apps/portal/src/app/dashboard/studenti/page.tsx apps/portal/src/app/dashboard/setari/page.tsx
git commit -m "feat(portal): add placeholder pages for dashboard nav"
```

---

### Task 2: Create responsive nav component

**Files:**

- Create: `apps/portal/src/components/dashboard/Nav.tsx`

- [ ] **Step 1: Write Nav component**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/dashboard/utilizatori", icon: "👥", label: "Utilizatori" },
  { href: "/dashboard/studenti", icon: "👨‍🎓", label: "Studenţi" },
  { href: "/dashboard/setari", icon: "⚙️", label: "Setări" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: Bottom nav - hidden on md+ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 md:hidden z-50">
        <div className="flex justify-around py-3 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center ${
                  isActive ? "text-blue-600" : "text-neutral-500"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: Sidebar - visible only on md+ */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[200px] flex-col bg-white border-r border-neutral-200 z-40">
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-lg font-bold text-neutral-800">Portal Brio.md</h1>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/components/dashboard/Nav.tsx
git commit -m "feat(portal): add responsive Nav component"
```

---

### Task 3: Create dashboard layout

**Files:**

- Create: `apps/portal/src/app/dashboard/layout.tsx`
- Modify: `apps/portal/src/app/dashboard/page.tsx:23-113` (move content to page.tsx)

- [ ] **Step 1: Create dashboard layout**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { Nav } from "@/components/dashboard/Nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav />
      {/* Header - desktop only, mobile uses bottom nav */}
      <header className="hidden md:block bg-white shadow-sm fixed top-0 left-[200px] right-0 z-30">
        <div className="px-6 py-4 flex justify-between items-center">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-neutral-600">{(session.user as any).name}</span>
          </div>
        </div>
      </header>

      {/* Main content - pushed right on desktop, above bottom nav on mobile */}
      <main className="md:ml-[200px] pb-20 md:pb-0 pt-0 md:pt-[65px]">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Update existing dashboard page to show only user info card**

The `/dashboard` page currently has all content (user card, admin section, quick links). Move the quick links to child pages and simplify `/dashboard` to just show user info card:

Modify `apps/portal/src/app/dashboard/page.tsx` — keep only the user info card section (lines 46-78), remove header, admin section, quick links.

- [ ] **Step 3: Commit**

```bash
git add apps/portal/src/app/dashboard/layout.tsx apps/portal/src/app/dashboard/page.tsx
git commit -m "feat(portal): add dashboard layout with responsive nav"
```

---

## Verification

1. Open portal at `/dashboard` — should see user info card
2. Resize browser below 768px — bottom nav icons appear, sidebar hidden
3. Resize above 768px — sidebar with labels appears, bottom nav hidden
4. Click nav items — routing works between pages
