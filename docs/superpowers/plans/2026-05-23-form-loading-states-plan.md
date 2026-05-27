# Form Loading States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add loading states to login forms in portal and learn apps using shared `packages/ui` components.

**Architecture:** Create `packages/ui` with `LoadingButton` and `LoginForm` components. Both apps import from `@brio-md/ui`. Login forms become client components using `useActionState` and `useFormStatus`.

**Tech Stack:** React 19 `useActionState`, `useFormStatus`, Tailwind

---

## File Structure

```
packages/ui/
  src/
    LoadingButton.tsx     ← new
    LoginForm.tsx         ← new
    index.ts              ← new
  package.json            ← new

apps/portal/src/app/page.tsx       ← modify
apps/learn/src/app/page.tsx        ← modify
```

---

## Task 1: Create `packages/ui` Package

**Files:**

- Create: `packages/ui/package.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/tsconfig.json`

- [ ] **Step 1: Create `packages/ui/package.json`**

```json
{
  "name": "@brio-md/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `packages/ui/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/ui/src/index.ts`**

```ts
export { LoadingButton } from "./LoadingButton";
export { LoginForm } from "./LoginForm";
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/package.json packages/ui/src/index.ts packages/ui/tsconfig.json
git commit -m "feat(ui): create @brio-md/ui package"
```

---

## Task 2: Create `LoadingButton` Component

**Files:**

- Create: `packages/ui/src/LoadingButton.tsx`

- [ ] **Step 1: Create `packages/ui/src/LoadingButton.tsx`**

```tsx
"use client";

import { useFormStatus } from "react-dom";

interface LoadingButtonProps {
  children: React.ReactNode;
  variant: "blue" | "green";
  formAction?: (formData: FormData) => void;
  className?: string;
}

const variants = {
  blue: {
    base: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    spinner: "border-blue-200 border-t-blue-600",
  },
  green: {
    base: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    spinner: "border-green-200 border-t-green-600",
  },
};

export function LoadingButton({
  children,
  variant = "blue",
  formAction,
  className = "",
}: LoadingButtonProps) {
  const { pending } = useFormStatus();
  const v = variants[variant];

  return (
    <button
      type="submit"
      disabled={pending}
      formAction={formAction}
      className={`
        w-full py-2 px-4 text-white font-medium rounded transition
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${v.base} ${className}
      `}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className={`opacity-25 ${v.spinner}`}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Signing in...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/LoadingButton.tsx
git commit -m "feat(ui): add LoadingButton component"
```

---

## Task 3: Create `LoginForm` Component

**Files:**

- Create: `packages/ui/src/LoginForm.tsx`

- [ ] **Step 1: Create `packages/ui/src/LoginForm.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { LoadingButton } from "./LoadingButton";

interface LoginFormProps {
  variant: "blue" | "green";
  error?: string | null;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function LoginForm({ variant, error, onSubmit }: LoginFormProps) {
  const [state, formAction] = useActionState(onSubmit, null);

  return (
    <form action={formAction}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          Invalid credentials. Please try again.
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          placeholder={variant === "blue" ? "admin@brio.md" : "teacher@vibe.md"}
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>

      <LoadingButton variant={variant}>Sign In</LoadingButton>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/LoginForm.tsx
git commit -m "feat(ui): add LoginForm component"
```

---

## Task 4: Update Portal Login Page

**Files:**

- Modify: `apps/portal/src/app/page.tsx`

- [ ] **Step 1: Update `apps/portal/src/app/page.tsx`**

```tsx
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@brio-md/auth";
import { LoginForm } from "@brio-md/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = params.error;

  async function handleLogin(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signIn(
        "credentials",
        {
          email,
          password,
        },
        {
          redirectTo: "/dashboard",
        },
      );
    } catch (error: any) {
      if (error?.digest?.includes("NEXT_REDIRECT")) {
        throw error;
      }
      redirect("/?error=Invalid+credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Staff Portal</h1>

        <LoginForm variant="blue" error={error} onSubmit={handleLogin} />

        <div className="mt-4 text-center">
          <Link href="https://learn.brio.md" className="text-sm text-blue-600 hover:underline">
            Go to Learning Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint/format**

```bash
npm run format && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add apps/portal/src/app/page.tsx
git commit -m "feat(portal): use LoginForm with loading state"
```

---

## Task 5: Update Learn Login Page

**Files:**

- Modify: `apps/learn/src/app/page.tsx`

- [ ] **Step 1: Update `apps/learn/src/app/page.tsx`**

```tsx
import { signIn } from "@/lib/auth";
import { auth } from "@brio-md/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@brio-md/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/courses");
  }

  const params = await searchParams;
  const error = params.error;

  async function handleLogin(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signIn(
        "credentials",
        {
          email,
          password,
        },
        {
          redirectTo: "/courses",
        },
      );
    } catch (error: any) {
      if (error?.digest?.includes("NEXT_REDIRECT")) {
        throw error;
      }
      redirect("/?error=Invalid+credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Learning Portal</h1>

        <LoginForm variant="green" error={error} onSubmit={handleLogin} />

        <div className="mt-4 text-center">
          <Link href="https://in.brio.md" className="text-sm text-green-600 hover:underline">
            Go to Staff Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint/format**

```bash
npm run format && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add apps/learn/src/app/page.tsx
git commit -m "feat(learn): use LoginForm with loading state"
```

---

## Task 6: Test the Implementation

- [ ] **Step 1: Start portal dev server**

```bash
cd apps/portal && npm run dev
```

- [ ] **Step 2: Navigate to http://localhost:3000 and test:**
- Form shows "Sign In" button
- Click submit — button becomes disabled with spinner and "Signing in..."
- Wait for response — form resets or shows error

- [ ] **Step 3: Start learn dev server**

```bash
cd apps/learn && npm run dev
```

- [ ] **Step 4: Navigate to http://localhost:3001 and test same flow**
- Green variant styling visible
- Loading state works

---

## Verification Checklist

- [ ] Portal login shows blue button, loading state works
- [ ] Learn login shows green button, loading state works
- [ ] Button disabled during submission
- [ ] Spinner + "Signing in..." text during loading
- [ ] Form still rejects invalid credentials with error banner
- [ ] `npm run lint` passes
- [ ] `npm run format` passes
