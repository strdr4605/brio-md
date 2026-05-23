"use client";

import { useActionState } from "react";
import { LoadingButton } from "./LoadingButton";

interface LoginFormProps {
  variant: "blue" | "green";
  error?: string | null;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function LoginForm({ variant, error, onSubmit }: LoginFormProps) {
  const [_state, formAction] = useActionState(onSubmit, null);

  return (
    <form action={formAction}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
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
