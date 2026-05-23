# Form Loading States — Design Spec

**Date:** 2026-05-23
**Status:** Approved

## Context

Add loading states to login forms in portal (`in.brio.md`) and learn (`learn.brio.md`). Forms should show disabled button with spinner and "Signing in..." text during submission. Solution must be extensible for future forms.

## Approach

Create `packages/ui` shared package containing reusable form components. Both apps import from `@brio-md/ui`.

### Tech Stack

- `useActionState` (React 19) for form submission + loading state
- `useFormStatus` for button pending state
- Tailwind for styling (already in both apps)

## Components

### `LoadingButton`

Client component using `useFormStatus()` to detect pending state.

**Props:**
- `children` — button label (shown when not loading)
- `variant` — `"blue" | "green"` for app-specific colors
- `formAction` — optional form action handler

**States:**
- Default: enabled, normal text
- Pending: disabled, spinner visible, text = "Signing in..."

### `LoginForm`

Client component wrapping login form logic.

**Props:**
- `variant` — `"blue" | "green"` passed to LoadingButton
- `error` — optional error message to display

**Behavior:**
- Uses `useActionState` to handle form submission
- Calls server action `handleLogin`
- Shows error banner when auth fails
- Redirects on success

## Data Flow

```
User clicks submit
  → useFormStatus().pending = true
  → LoadingButton disabled, shows spinner, text = "Signing in..."
  → Server action runs
  → useActionState receives result
  → pending = false, form shows error or redirects
```

## File Structure

```
packages/ui/
  src/
    LoadingButton.tsx
    LoginForm.tsx
    index.ts
  package.json

apps/portal/src/app/page.tsx      → imports LoginForm from @brio-md/ui
apps/learn/src/app/page.tsx       → imports LoginForm from @brio-md/ui
```

## Server Actions

Each app keeps its own `handleLogin` server action (in page.tsx or separate file). LoginForm accepts `onSubmit` prop for custom handler.

## Extensibility

`LoadingButton` reusable across any form. Future forms:
1. Import `LoadingButton` from `@brio-md/ui`
2. Wrap in component using `useActionState`
3. Pass custom `formAction`

## Styling

- Portal (blue): `bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`
- Learn (green): `bg-green-600 hover:bg-green-700 focus:ring-green-500`
- Spinner: Tailwind `animate-spin` + `inline` for text integration
- Error banner: matches existing style (`bg-red-50 border-red-200 text-red-700`)