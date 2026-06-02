# Permission Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SuperAdmin can define permission definitions (key, label, description) and assign them to users via checkboxes.

**Architecture:** New `permissionDefinitions` table + tRPC router with superProcedure guards. UserForm gets checkboxes from permissionDefinition.list. New `/dashboard/permissions` page for CRUD. Nav updated to show Permisiuni link for superAdmin only.

**Tech Stack:** Drizzle ORM, tRPC, Next.js 16, Zod, Tailwind

---

## File Structure

| Action | File                                                                                |
| ------ | ----------------------------------------------------------------------------------- |
| Modify | `packages/db/src/schema.ts` — add `permissionDefinitions` table                     |
| Modify | `apps/portal/src/lib/db.ts` — add table to drizzle schema                           |
| Create | `apps/portal/src/server/routers/permission.ts` — CRUD router                        |
| Modify | `apps/portal/src/server/routers/_app.ts` — register router                          |
| Modify | `apps/portal/src/server/routers/user.ts` — invalidate sessions on permission change |
| Modify | `apps/portal/src/scripts/seed.ts` — seed default permission definitions             |
| Modify | `apps/portal/src/components/dashboard/Nav.tsx` — add Permisiuni link for superAdmin |
| Modify | `apps/portal/src/app/dashboard/layout.tsx` — pass permissions to Nav                |
| Create | `apps/portal/src/app/dashboard/permissions/page.tsx` — CRUD UI                      |
| Modify | `apps/portal/src/components/dashboard/UserForm.tsx` — permission checkboxes         |

---

### Task 1: Add `permissionDefinitions` table to DB schema

**Files:**

- Modify: `packages/db/src/schema.ts`

- [ ] **Step 1: Add permissionDefinitions table**

```typescript
// Add to packages/db/src/schema.ts, after schools table

export const permissionDefinitions = pgTable("permission_definitions", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PermissionDefinition = typeof permissionDefinitions.$inferSelect;
```

- [ ] **Step 2: Push schema to DB**

```bash
npm run db:push
```

Workdir: `apps/portal`

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat(db): add permission_definitions table"
```

---

### Task 2: Register permissionDefinitions in portal DB instance

**Files:**

- Modify: `apps/portal/src/lib/db.ts`

- [ ] **Step 1: Add permissionDefinitions to drizzle schema**

Replace the import and drizzle init:

```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, schools, courses, sessions, permissionDefinitions } from "@/db/schema";

const sql = postgres(
  process.env.DATABASE_URL || "postgres://brio:briopassword@localhost:5432/brio_md",
  { max: 1 },
);
export const db = drizzle(sql, {
  schema: { users, schools, courses, sessions, permissionDefinitions },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/lib/db.ts
git commit -m "feat(db): register permission_definitions in portal db"
```

---

### Task 3: Create permission definition tRPC router

**Files:**

- Create: `apps/portal/src/server/routers/permission.ts`

- [ ] **Step 1: Create CRUD router**

```typescript
import { z } from "zod";
import { router, superProcedure } from "../trpc";
import { permissionDefinitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";

export const permissionDefinitionRouter = router({
  list: superProcedure.query(async () => {
    return db.select().from(permissionDefinitions).orderBy(permissionDefinitions.key);
  }),

  create: superProcedure
    .input(
      z.object({
        key: z.string().min(1).max(100),
        label: z.string().min(1).max(255),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [result] = await db.insert(permissionDefinitions).values(input).returning();
      return result;
    }),

  update: superProcedure
    .input(
      z.object({
        id: z.number(),
        label: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const [result] = await db
        .update(permissionDefinitions)
        .set(updates)
        .where(eq(permissionDefinitions.id, id))
        .returning();
      return result;
    }),

  delete: superProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.delete(permissionDefinitions).where(eq(permissionDefinitions.id, input.id));
    return { success: true };
  }),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/permission.ts
git commit -m "feat(api): add permissionDefinition CRUD router"
```

---

### Task 4: Register permission router in app router

**Files:**

- Modify: `apps/portal/src/server/routers/_app.ts`

- [ ] **Step 1: Add permissionDefinition to appRouter**

```typescript
import { router } from "../trpc";
import { userRouter } from "./user";
import { permissionDefinitionRouter } from "./permission";

export const appRouter = router({
  user: userRouter,
  permissionDefinition: permissionDefinitionRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/_app.ts
git commit -m "feat(api): register permissionDefinition router"
```

---

### Task 5: Invalidate sessions on user permissions change

**Files:**

- Modify: `apps/portal/src/server/routers/user.ts`

- [ ] **Step 1: Invalidate sessions when permissions change**

In `userRouter.update` mutation, add session invalidation when permissions are updated. Replace the mutation body:

```typescript
// In userRouter.update, replace the .mutation body:
.mutation(async ({ input }) => {
  const { id, password, ...updates } = input;
  if (password) {
    (updates as any).passwordHash = await hash(password, 12);
  }
  // Invalidate sessions when permissions or password change
  if (password || "permissions" in updates) {
    (updates as any).lastChangedAt = new Date();
    await db.delete(sessions).where(eq(sessions.userId, id));
  }
  const [result] = await db.update(users).set(updates).where(eq(users.id, id)).returning();

  return result;
}),
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/user.ts
git commit -m "feat: invalidate sessions on permission change"
```

---

### Task 6: Seed default permission definitions

**Files:**

- Modify: `apps/portal/src/scripts/seed.ts`

- [ ] **Step 1: Import and seed permissionDefinitions**

Import `permissionDefinitions` from `@brio-md/db`. Add seed block before the users section:

```typescript
import { schools, users, courses, permissionDefinitions } from "@brio-md/db";

// After courses seeding, add:
const [permSuper] = await db
  .insert(permissionDefinitions)
  .values({
    key: "super",
    label: "Super Administrator",
    description: "Acces complet la sistem. Poate gestiona școli, utilizatori și permisiuni.",
  })
  .returning();
console.log("✅ Created permission:", permSuper.key);

const [permAdmin] = await db
  .insert(permissionDefinitions)
  .values({
    key: "admin",
    label: "Admin Școală",
    description: "Gestionează utilizatorii și cursurile din școala sa.",
  })
  .returning();
console.log("✅ Created permission:", permAdmin.key);
```

- [ ] **Step 2: Run seed to verify**

```bash
npm run db:seed
```

Workdir: `apps/portal`
Expected: prints "Created permission: super" and "Created permission: admin"

- [ ] **Step 3: Commit**

```bash
git add apps/portal/src/scripts/seed.ts
git commit -m "feat: seed default permission definitions"
```

---

### Task 7: Update Nav with Permisiuni link (superAdmin only)

**Files:**

- Modify: `apps/portal/src/components/dashboard/Nav.tsx`

- [ ] **Step 1: Add permissions prop and dynamic nav items**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function Nav({
  userName,
  permissions,
}: {
  userName?: string;
  permissions?: string[];
}) {
  const pathname = usePathname();
  const isSuperAdmin = permissions?.includes("super");

  const navItems = [
    { href: "/dashboard", icon: "🏠", label: "Dashboard" },
    { href: "/dashboard/users", icon: "👥", label: "Utilizatori" },
    { href: "/dashboard/students", icon: "👨‍🎓", label: "Studenţi" },
    ...(isSuperAdmin
      ? [{ href: "/dashboard/permissions", icon: "🔑", label: "Permisiuni" }]
      : []),
    { href: "/dashboard/settings", icon: "⚙️", label: "Setări" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 md:hidden z-50">
        <div className="flex justify-around py-3 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center ${
                  isActive ? "text-blue-600" : "text-neutral-500"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`text-xs ${isActive ? "font-bold" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <div className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center">
            <span className="text-xl">🚪</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs text-neutral-500"
            >
              {userName ? userName.split(" ")[0] : ""}
            </button>
          </div>
        </div>
      </nav>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[200px] flex-col bg-white border-r border-neutral-200 z-40">
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-lg font-bold text-neutral-800">Portal Brio.md</h1>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-neutral-200">
          <div className="px-3 py-2 text-sm text-neutral-600 mb-1">{userName}</div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-neutral-600 hover:bg-neutral-100"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Deconectare</span>
          </button>
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/components/dashboard/Nav.tsx
git commit -m "feat(nav): add Permisiuni link for superAdmin"
```

---

### Task 8: Pass permissions to Nav from layout

**Files:**

- Modify: `apps/portal/src/app/dashboard/layout.tsx`

- [ ] **Step 1: Pass permissions prop to Nav**

```typescript
import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { Nav } from "@/components/dashboard/Nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userData = session.user as any;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav userName={userData.name} permissions={userData.permissions || []} />

      <main className="md:ml-[200px] pb-20 md:pb-0 pt-0">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/app/dashboard/layout.tsx
git commit -m "feat: pass permissions to Nav component"
```

---

### Task 9: Create permissions management page

**Files:**

- Create: `apps/portal/src/app/dashboard/permissions/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
"use client";

import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PermissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const permissions = (session?.user as any)?.permissions || [];
  const isSuperAdmin = permissions.includes("super");

  const utils = trpc.useUtils();
  const { data: definitions = [], isLoading } =
    trpc.permissionDefinition.list.useQuery(undefined, {
      enabled: isSuperAdmin,
    });

  const createMutation = trpc.permissionDefinition.create.useMutation({
    onSuccess: () => {
      utils.permissionDefinition.list.invalidate();
      setShowForm(false);
      setNewKey("");
      setNewLabel("");
      setNewDesc("");
    },
  });

  const updateMutation = trpc.permissionDefinition.update.useMutation({
    onSuccess: () => {
      utils.permissionDefinition.list.invalidate();
      setEditingId(null);
      setEditLabel("");
      setEditDesc("");
    },
  });

  const deleteMutation = trpc.permissionDefinition.delete.useMutation({
    onSuccess: () => utils.permissionDefinition.list.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <p className="text-neutral-600">Nu ai permisiunea să accesezi această pagină.</p>
      </div>
    );
  }

  const handleEdit = (def: (typeof definitions)[number]) => {
    setEditingId(def.id);
    setEditLabel(def.label);
    setEditDesc(def.description || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
    setEditDesc("");
  };

  const handleSaveEdit = (id: number) => {
    updateMutation.mutate({ id, label: editLabel, description: editDesc || undefined });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Permisiuni</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border rounded-lg p-4 shadow">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Cheie</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="ex: open-front-door"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Etichetă</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="ex: Acces Ușă Față"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descriere</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Descrierea permisiunii"
              />
            </div>
            {createMutation.error && (
              <p className="text-red-600 text-sm">{createMutation.error.message}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() =>
                  createMutation.mutate({
                    key: newKey,
                    label: newLabel,
                    description: newDesc || undefined,
                  })
                }
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "Se salvează..." : "Salvează"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewKey("");
                  setNewLabel("");
                  setNewDesc("");
                }}
                className="px-4 py-2 border rounded-lg hover:bg-neutral-100"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : definitions.length === 0 ? (
        <p className="text-neutral-600">Nu există permisiuni definite.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {definitions.map((def) => (
              <div key={def.id} className="bg-white border rounded-lg p-4 shadow">
                {editingId === def.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Etichetă</label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Descriere</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    {updateMutation.error && (
                      <p className="text-red-600 text-sm">{updateMutation.error.message}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(def.id)}
                        disabled={updateMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Salvează
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border rounded-lg hover:bg-neutral-100"
                      >
                        Anulează
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm">{def.key}</p>
                      <p className="text-neutral-700">{def.label}</p>
                      {def.description && (
                        <p className="text-sm text-neutral-500 mt-1">{def.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-3">
                      <button
                        onClick={() => handleEdit(def)}
                        className="p-2 text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                        aria-label="Editează"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Sigur ștergi această permisiune?")) {
                            deleteMutation.mutate({ id: def.id });
                          }
                        }}
                        className="p-2 text-red-600 border border-red-200 rounded hover:bg-red-50"
                        aria-label="Șterge"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left">Cheie</th>
                  <th className="px-4 py-3 text-left">Etichetă</th>
                  <th className="px-4 py-3 text-left">Descriere</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {definitions.map((def) => (
                  <tr key={def.id} className="border-t">
                    {editingId === def.id ? (
                      <>
                        <td className="px-4 py-3 font-mono text-sm">{def.key}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(def.id)}
                              disabled={updateMutation.isPending}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Salvează
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-neutral-600 hover:underline text-sm"
                            >
                              Anulează
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-mono text-sm">{def.key}</td>
                        <td className="px-4 py-3">{def.label}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {def.description || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(def)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Editează
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Sigur ștergi această permisiune?")) {
                                  deleteMutation.mutate({ id: def.id });
                                }
                              }}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Șterge
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/app/dashboard/permissions/page.tsx
git commit -m "feat(ui): add permissions management page"
```

---

### Task 10: Add permission checkboxes to UserForm

**Files:**

- Modify: `apps/portal/src/components/dashboard/UserForm.tsx`

- [ ] **Step 1: Add permission definitions fetch and checkboxes**

```typescript
"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface User {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  schoolId?: number | null;
  permissions?: string[];
  active?: boolean;
}

interface Props {
  user: User | null;
  schools: { id: number; name: string }[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  onClose: () => void;
  currentUserSchoolId?: number;
}

export function UserFormDrawer({
  user,
  schools,
  isSuperAdmin,
  isAdmin,
  onClose,
  currentUserSchoolId,
}: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!user?.id;

  const { data: permissionDefs = [] } =
    trpc.permissionDefinition.list.useQuery(undefined, {
      enabled: isSuperAdmin,
    });

  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      onClose();
    },
  });

  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      onClose();
    },
  });

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || ("teacher" as "teacher" | "admin" | "superadmin"),
    schoolId: user?.schoolId || currentUserSchoolId || null,
    permissions: user?.permissions || [],
    active: user?.active ?? true,
  });

  const canSelectSchool = isSuperAdmin;
  const canSelectRole = isSuperAdmin;

  const togglePermission = (key: string) => {
    setFormData((prev) => {
      const current = prev.permissions;
      if (current.includes(key)) {
        return { ...prev, permissions: current.filter((p) => p !== key) };
      }
      return { ...prev, permissions: [...current, key] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const { password, ...rest } = formData;
      updateMutation.mutate({
        id: user.id!,
        ...rest,
        ...(password ? { password } : {}),
      } as any);
    } else {
      createMutation.mutate(formData as any);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {isEditing ? "Editează Utilizator" : "Adaugă Utilizator"}
            </h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nume</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {isEditing ? (
              <div>
                <label className="block text-sm font-medium mb-1">Parolă</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Introdu nouă parolă sau lasă gol"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Parolă</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            {canSelectRole && (
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="teacher">Profesor</option>
                  <option value="admin">Admin Şcoală</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            )}

            {canSelectSchool && (
              <div>
                <label className="block text-sm font-medium mb-1">Şcoală</label>
                <select
                  value={formData.schoolId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, schoolId: Number(e.target.value) || null })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selectează şcoală</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSuperAdmin && permissionDefs.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Permisiuni</label>
                <div className="space-y-2">
                  {permissionDefs.map((def) => (
                    <label
                      key={def.key}
                      className="flex items-start gap-3 min-h-[44px] py-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(def.key)}
                        onChange={() => togglePermission(def.key)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium">{def.label}</p>
                        {def.description && (
                          <p className="text-xs text-neutral-500">{def.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <span className="text-sm font-medium">Activ</span>
              </label>
            </div>

            {createMutation.error && (
              <p className="text-red-600 text-sm">{createMutation.error.message}</p>
            )}
            {updateMutation.error && (
              <p className="text-red-600 text-sm">{updateMutation.error.message}</p>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Se salvează..."
                  : isEditing
                    ? "Salvează Modificările"
                    : "Creează Utilizator"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-neutral-100"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/components/dashboard/UserForm.tsx
git commit -m "feat(ui): add permission checkboxes to UserForm"
```

---

### Task 11: Format and lint

**Files:** all modified

- [ ] **Step 1: Format code**

```bash
npm run format
```

- [ ] **Step 2: Lint code**

```bash
npm run lint
```

- [ ] **Step 3: Fix any lint errors**

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: format and lint"
```
