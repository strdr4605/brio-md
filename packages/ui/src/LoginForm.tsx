"use client";

import { useState, useTransition } from "react";
import { LoadingButton } from "./LoadingButton";

type LoginFormProps = {
  variant?: "blue" | "green" | "slate" | "indigo";
  error?: string | null;
  onSubmit: (formData: FormData) => Promise<void>;
};

export function LoginForm({ variant = "blue", error, onSubmit }: LoginFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [, startTransition] = useTransition();

  const focusRing =
    variant === "blue"
      ? "focus:ring-blue-500"
      : variant === "slate"
        ? "focus:ring-slate-900"
        : variant === "indigo"
          ? "focus:ring-indigo-500"
          : "focus:ring-green-500";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={`w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 transition ${focusRing}`}
          placeholder="@brio.md"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
          Parolă
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className={`w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 transition ${focusRing}`}
          placeholder="••••••••"
        />
      </div>

      <div className="pt-2">
        <LoadingButton variant={variant} isPending={isPending}>
          Autentificare
        </LoadingButton>
      </div>
    </form>
  );
}
