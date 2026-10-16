"use client";

import Link from "next/link";
import { Card, LoginForm, ExternalLinkIcon, SparklesIcon } from "@brio-md/ui";

type Props = {
  error?: string | null;
  onSubmit: (formData: FormData) => Promise<void>;
};

export function LoginRoleCard({ error, onSubmit }: Props) {
  return (
    <Card className="p-6 sm:p-8 w-full max-w-md shadow-xs transition-all">
      {/* Header Info */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-3 transition-all bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-100">
          B
        </div>

        <div className="inline-flex items-center gap-1 mb-1.5">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <SparklesIcon className="w-3 h-3 text-indigo-500" />
            <span>Spațiu Interactiv de Învățare</span>
          </span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Learning Portal Elevi
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Autentificare pentru cursuri, teme și jocuri interactive
        </p>
      </div>

      {/* Form */}
      <LoginForm
        variant="indigo"
        error={error}
        onSubmit={onSubmit}
      />

      {/* Footer Links */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <Link
          href="https://in.brio.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <span>Portal Staff (Cadre Didactice)</span>
          <ExternalLinkIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
}