# Utilizatori User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user management page with list, create/edit forms. Superadmin sees all users; school admin sees only their school's users.

**Architecture:** tRPC backend (user router already exists), React frontend with side drawer for create/edit forms.

**Tech Stack:** Next.js, tRPC, Tailwind, Drizzle ORM.

---

## File Structure

- **Modify:** `apps/portal/src/app/dashboard/utilizatori/page.tsx` - Main page with list + drawer
- **Create:** `apps/portal/src/components/dashboard/UserForm.tsx` - Create/Edit user form component
- **Modify:** `apps/portal/src/server/routers/user.ts` - Update CRUD implementations (mock → real DB)

---

## Task 1: User List Component

**Files:**
- Modify: `apps/portal/src/app/dashboard/utilizatori/page.tsx`

- [ ] **Step 1: Replace placeholder with list component**

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function UtilizatoriPage() {
  const { data: session } = useSession();
  const permissions = (session?.user as any)?.permissions || [];
  const isSuperAdmin = permissions.includes("super");
  const isAdmin = permissions.includes("admin");

  const { data: users = [], isLoading } = trpc.user.list.useQuery({});
  const { data: schools = [] } = trpc.user.listSchools.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Utilizatori</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adaugă Utilizator
        </button>
      </div>

      {isLoading ? (
        <p>Se încarcă...</p>
      ) : users.length === 0 ? (
        <p className="text-neutral-600">Nu există utilizatori.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left">Nume</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                {isSuperAdmin && <th className="px-4 py-3 text-left">Şcoală</th>}
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const school = schools.find((s: any) => s.id === user.schoolId);
                return (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${
                        user.role === "superadmin" ? "bg-purple-100 text-purple-700" :
                        user.role === "admin" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3">{school?.name || "-"}</td>
                    )}
                    <td className="px-4 py-3">
                      {user.active ? (
                        <span className="text-green-600">Activ</span>
                      ) : (
                        <span className="text-red-600">Inactiv</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:underline"
                      >
                        Editează
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Side Drawer */}
      {showForm && (
        <UserFormDrawer
          user={editingUser}
          schools={schools}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          onClose={() => setShowForm(false)}
          currentUserSchoolId={(session?.user as any)?.schoolId}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create UserFormDrawer component** (see Task 2)

- [ ] **Step 3: Commit**

```bash
git add apps/portal/src/app/dashboard/utilizatori/page.tsx
git commit -m "feat(portal): add user list component to utilizatori page"
```

---

## Task 2: User Create/Edit Form Drawer

**Files:**
- Create: `apps/portal/src/components/dashboard/UserForm.tsx`

- [ ] **Step 1: Create UserForm.tsx**

```tsx
"use client";

import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

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

export function UserFormDrawer({ user, schools, isSuperAdmin, isAdmin, onClose, currentUserSchoolId }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!user?.id;

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
    role: user?.role || "teacher",
    schoolId: user?.schoolId || currentUserSchoolId || null,
    permissions: user?.permissions || [],
    active: user?.active ?? true,
  });

  const canSelectSchool = isSuperAdmin;
  const canSelectRole = isSuperAdmin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate({ id: user.id!, ...formData });
    } else {
      createMutation.mutate(formData);
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

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium mb-1">Parolă</label>
                <input
                  type="password"
                  required
                  minLength={8}
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
                  onChange={(e) => setFormData({ ...formData, schoolId: Number(e.target.value) || null })}
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

- [ ] **Step 2: Add missing import at top of UserForm.tsx**

```tsx
import { useState } from "react";
```

- [ ] **Step 3: Update utilizatori page to import UserFormDrawer**

Add import at top of page.tsx:
```tsx
import { UserFormDrawer } from "@/components/dashboard/UserForm";
```

- [ ] **Step 4: Commit**

```bash
git add apps/portal/src/components/dashboard/UserForm.tsx apps/portal/src/app/dashboard/utilizatori/page.tsx
git commit -m "feat(portal): add user create/edit form drawer"
```

---

## Task 3: Update tRPC Router with Real DB Implementation

**Files:**
- Modify: `apps/portal/src/server/routers/user.ts`

- [ ] **Step 1: Update user router with real DB implementation**

```typescript
import { z } from "zod";
import { router, protectedProcedure, superProcedure } from "../trpc";
import { eq, ilike, and } from "drizzle-orm";
import { users } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";

export const userRouter = router({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const userId = parseInt(ctx.user.id);
    return { ...ctx.user, id: userId };
  }),

  // List users (filtered by permissions)
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          schoolId: z.number().optional(),
          role: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return [];
      const user = ctx.user;
      const permissions = user.permissions || [];

      const conditions = [];

      if (!permissions.includes("super")) {
        if (permissions.includes("admin")) {
          if (user.schoolId) {
            conditions.push(eq(users.schoolId, user.schoolId));
          } else {
            return [];
          }
        } else {
          return [
            {
              id: parseInt(user.id),
              email: user.email,
              name: user.name,
              role: user.role,
              permissions: user.permissions,
              courseIds: user.courseIds,
              schoolId: user.schoolId,
              active: true,
            },
          ];
        }
      }

      if (input?.search) {
        conditions.push(ilike(users.name, `%${input.search}%`));
      }
      if (input?.schoolId) {
        conditions.push(eq(users.schoolId, input.schoolId));
      }
      if (input?.role) {
        conditions.push(eq(users.role, input.role));
      }

      const result = await ctx.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          permissions: users.permissions,
          courseIds: users.courseIds,
          schoolId: users.schoolId,
          phone: users.phone,
          info: users.info,
          active: users.active,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return result;
    }),

  // Get user by ID
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const user = ctx.user;
    const permissions = user.permissions || [];

    if (!permissions.includes("super")) {
      if (permissions.includes("admin")) {
        if (input.id !== parseInt(user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot view this user" });
        }
      } else {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot view users" });
      }
    }

    const [result] = await ctx.db.select().from(users).where(eq(users.id, input.id)).limit(1);
    return result || null;
  }),

  // Create user
  create: superProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
        role: z.enum(["superadmin", "admin", "teacher"]),
        permissions: z.array(z.string()),
        courseIds: z.array(z.number()).optional(),
        schoolId: z.number().nullable().optional(),
        phone: z.string().optional(),
        info: z.string().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const passwordHash = await hash(input.password, 12);
      const [result] = await ctx.db
        .insert(users)
        .values({
          email: input.email,
          passwordHash,
          name: input.name,
          role: input.role,
          permissions: input.permissions,
          courseIds: input.courseIds || [],
          schoolId: input.schoolId,
          phone: input.phone,
          info: input.info,
          active: input.active ?? true,
        })
        .returning();

      return result;
    }),

  // Update user
  update: superProcedure
    .input(
      z.object({
        id: z.number(),
        email: z.string().email().optional(),
        name: z.string().min(1).optional(),
        role: z.enum(["superadmin", "admin", "teacher"]).optional(),
        permissions: z.array(z.string()).optional(),
        courseIds: z.array(z.number()).optional(),
        schoolId: z.number().nullable().optional(),
        phone: z.string().optional(),
        info: z.string().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const [result] = await ctx.db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();

      return result;
    }),

  // Delete user (soft delete - set active = false)
  delete: superProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [result] = await ctx.db
      .update(users)
      .set({ active: false })
      .where(eq(users.id, input.id))
      .returning();

    return result;
  }),

  // List schools
  listSchools: protectedProcedure.query(async () => {
    const result = await ctx.db.select().from(schools);
    return result;
  }),

  // List courses
  listCourses: protectedProcedure
    .input(
      z
        .object({
          schoolId: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (input?.schoolId) {
        return ctx.db.select().from(courses).where(eq(courses.schoolId, input.schoolId));
      }
      return ctx.db.select().from(courses);
    }),
});
```

Note: Add import for `schools` and `courses` from `@/db/schema`.

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/server/routers/user.ts
git commit -m "feat(portal): implement real DB operations in user router"
```

---

## Task 4: Wire Up School Admin Permissions

**Files:**
- Modify: `apps/portal/src/components/dashboard/UserForm.tsx`

- [ ] **Step 1: Update UserForm to support admin permissions for editing**

```tsx
// In UserFormDrawer, after permissions check:
// Admin can edit users in their school but cannot change school or role
```

For admin users, they should be able to:
- Edit name, email, active status
- NOT change role, school, or permissions (those require superadmin)

- [ ] **Step 2: Commit**

```bash
git add apps/portal/src/components/dashboard/UserForm.tsx
git commit -m "feat(portal): add admin edit permissions for users"
```

---

## Task 5: Verify Build

- [ ] **Step 1: Run build**

```bash
cd apps/portal && npm run build
```

Expected: Success with no errors

- [ ] **Step 2: Run lint**

```bash
cd apps/portal && npm run lint
```

Expected: No lint errors

---

## Verification

1. **SuperAdmin login:**
   - See all users from all schools
   - Can create new user with email, password, name, school selection
   - Can edit any user (all fields)
   - Can see school column

2. **School Admin login:**
   - See only users from their school
   - Create user (school pre-selected, not changeable)
   - Edit user (name, email only - role/school not changeable)
   - No school column in list

3. **Mobile:** Bottom nav works, logout visible