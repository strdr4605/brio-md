"use client";

import { useState, useTransition } from "react";
import { LoadingButton } from "./LoadingButton";

type LoginFormProps = {
  variant: "blue" | "green";
  error?: string | null;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function LoginForm({ variant, error, onSubmit }: LoginFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [, startTransition] = useTransition();
  const focusRing = variant === "blue" ? "focus:ring-blue-500" : "focus:ring-green-500";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await onSubmit(formData);
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
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
          className={`w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusRing}`}
          placeholder={"@brio.md"}
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
          Parolă
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className={`w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusRing}`}
          placeholder="••••••••"
        />
      </div>

      <LoadingButton variant={variant} isPending={isPending}>
        Autentificare
      </LoadingButton>
    </form>
  );
}
