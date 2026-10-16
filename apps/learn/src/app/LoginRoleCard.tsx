"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, LoginForm, ExternalLinkIcon, SparklesIcon } from "@brio-md/ui";

type Props = {
  error?: string | null;
  onSubmit: (formData: FormData) => Promise<void>;
};

export function LoginRoleCard({ error, onSubmit }: Props) {
  const [role, setRole] = useState<"student" | "teacher">("student");

  const isStudent = role === "student";

  return (
    <Card className="p-6 sm:p-8 w-full max-w-md shadow-xs transition-all">
      {/* Role Toggle Switcher */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-xl mb-6 border border-slate-200/60">
        <button
          type="button"
          onClick={() => setRole("student")}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isStudent
              ? "bg-white text-indigo-700 shadow-xs border border-indigo-100/60"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🎒</span>
          <span>Sunt Elev</span>
        </button>

        <button
          type="button"
          onClick={() => setRole("teacher")}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            !isStudent
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🎓</span>
          <span>Sunt Profesor</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="text-center mb-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-3 transition-all ${
            isStudent
              ? "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-100"
              : "bg-slate-900 text-white shadow-xs"
          }`}
        >
          B
        </div>

        <div className="inline-flex items-center gap-1 mb-1.5">
          {isStudent ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <SparklesIcon className="w-3 h-3 text-indigo-500" />
              <span>Spațiu Interactiv de Învățare</span>
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Cadru Didactic & Management
            </span>
          )}
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {isStudent ? "Learning Portal Elevi" : "Learning Portal Profesori"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isStudent
            ? "Autentificare pentru cursuri, teme și jocuri interactive"
            : "Managementul sesiunilor de curs și evaluarea elevilor"}
        </p>
      </div>

      {/* Form */}
      <LoginForm
        variant={isStudent ? "indigo" : "slate"}
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
