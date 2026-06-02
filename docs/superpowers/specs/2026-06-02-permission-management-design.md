# Permission Management - SuperAdmin CRUD

**Date:** 2026-06-02
**Status:** Draft
**Scope:** Portal app only

## Overview

SuperAdmin can define system-wide permissions (key, label, description) and assign them to users. Permissions are stored as string keys in `users.permissions` array. Permission definitions live in new `permission_definitions` table.

## Database

### New Table: `permission_definitions`

| Column      | Type         | Notes                                |
| ----------- | ------------ | ------------------------------------ |
| id          | serial PK    |                                      |
| key         | varchar(100) | unique, e.g. "super"                 |
| label       | varchar(255) | Romanian, e.g. "Super Administrator" |
| description | text         | Romanian, optional                   |
| created_at  | timestamp    | default now()                        |

### Existing: `users.permissions`

Stays as `text[]` array of permission keys. No foreign key constraint to `permission_definitions` (flexibility — a definition can be deleted without breaking user data, just won't show label).

### Migration

Add `permission_definitions` table. Seed defaults: `super`, `admin`.

## Backend

### Auth (reuse existing)

`superProcedure` already exists in `apps/portal/src/server/trpc.ts:51` — checks `permissions.includes("super")`.

### New Router: `permissionDefinition`

File: `apps/portal/src/server/routers/permission.ts`

All procedures use `superProcedure`.

- `list` — returns all permission definitions
- `create` — adds new definition (key, label, description)
- `update` — updates label/description by id
- `delete` — removes definition by id

### Modified Router: `user`

- `list` — join with permission_definitions to include labels in response
- `update` — invalidate sessions (`delete from sessions`) when permissions change (prevents stale JWT)

### App Router Update

File: `apps/portal/src/server/routers/_app.ts`

Add `permissionDefinition` router.

## UI

### Layout / Nav

File: `apps/portal/src/components/dashboard/Nav.tsx`

- Add `navItems` entry: `{ href: "/dashboard/permissions", icon: "🔑", label: "Permisiuni" }`
- Show only when user is SuperAdmin (pass `isSuperAdmin` prop or read from session)
- Mobile: new bottom nav tab
- Desktop: new sidebar link

### Permission Management Page

Route: `/dashboard/permissions`
File: `apps/portal/src/app/dashboard/permissions/page.tsx`

SuperAdmin only (redirect if not SuperAdmin).

**Mobile (default):**

- Page title "Permisiuni" + "Adaugă" button top-right
- Stacked cards, each showing:
  - Row: key (bold) | edit 🗑 delete buttons
  - Line: label
  - Line: description (gray, smaller)
- "Adaugă" shows inline form at top of list:
  - Input: key
  - Input: label
  - Input: description
  - Save / Cancel buttons

**Desktop (md:block):**

- Table with columns: Key | Label | Description | Actions
- "Adaugă" opens inline row at top of table

### UserForm Update

File: `apps/portal/src/components/dashboard/UserForm.tsx`

- SuperAdmin sees "Permisiuni" section above "Activ" checkbox
- Fetches `permissionDefinition.list` via tRPC
- Checkboxes for each permission definition:
  - Checkbox + label (bold)
  - Description below (small text)
- Full-width touch targets (min 44px height)
- Selected permissions stored as `string[]` of keys

## Behavior

- Editing permissions resets user sessions (they re-login)
- Deleting a permission definition is safe — user's `permissions` array keeps the key, just no label shown in UI
- Duplicate keys prevented by DB unique constraint
- Permission definitions are global, not per-school

## Implementation Order

1. Schema: add `permission_definitions` table + migration + seed
2. Backend: `permissionDefinition` router
3. Backend: update `user.list` and `user.update` for permissions
4. UI: permission management page
5. UI: nav update (Permissions link)
6. UI: UserForm permissions checkboxes
