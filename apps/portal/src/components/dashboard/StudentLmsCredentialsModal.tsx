"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { XIcon, CheckCircleIcon, KeyIcon } from "@/components/ui/icons";

function CopyIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export type StudentLmsCredentialsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
};

type GeneratedCredentials = {
  username: string;
  password: string;
  isReset: boolean;
};

export function StudentLmsCredentialsModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: StudentLmsCredentialsModalProps) {
  const [generatedCredentials, setGeneratedCredentials] =
    useState<GeneratedCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<"username" | "password" | "card" | null>(null);

  const utils = trpc.useUtils();

  const {
    data: lmsAccess,
    isLoading,
  } = trpc.student.getLmsAccess.useQuery(
    { studentId },
    { enabled: isOpen && Boolean(studentId) },
  );

  const provisionMutation = trpc.student.provisionLmsAccess.useMutation({
    onSuccess: (data) => {
      setGeneratedCredentials({
        username: data.username,
        password: data.password,
        isReset: data.isReset,
      });
      utils.student.getLmsAccess.invalidate({ studentId });
    },
    onError: (err) => {
      alert(err.message || "A apărut o eroare la generarea accesului LMS.");
    },
  });

  if (!isOpen) return null;

  const handleCopy = async (text: string, field: "username" | "password" | "card") => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    setGeneratedCredentials(null);
    setCopiedField(null);
    onClose();
  };

  const handleGenerate = () => {
    provisionMutation.mutate({ studentId });
  };

  const cardHandoverText = generatedCredentials
    ? `Acces Platforma Learn (learn.brio.md):\nElev: ${studentName}\nLink: https://learn.brio.md\nUsername: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <KeyIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Acces LMS Elev
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
                {studentName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isLoading ? (
          <div className="py-8 text-center space-y-2 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
            <div className="h-3 bg-slate-100 rounded w-1/3 mx-auto" />
          </div>
        ) : generatedCredentials ? (
          /* Credentials Handover Card */
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {generatedCredentials.isReset
                  ? "Parolă resetată cu succes!"
                  : "Credențiale generate cu succes!"}
              </span>
            </div>

            {/* Parent Handover Card */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Fișă Acces Părinți & Elev
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 font-mono text-slate-700">
                  learn.brio.md
                </span>
              </div>

              {/* Username row */}
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                <div className="min-w-0">
                  <span className="text-[10px] block font-semibold text-slate-400 uppercase">
                    Username
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                    {generatedCredentials.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(generatedCredentials.username, "username")}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition shrink-0 flex items-center gap-1"
                >
                  {copiedField === "username" ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <CheckCircleIcon className="w-3.5 h-3.5" /> Copiat
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <CopyIcon className="w-3.5 h-3.5" /> Copiază
                    </span>
                  )}
                </button>
              </div>

              {/* Password row */}
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                <div className="min-w-0">
                  <span className="text-[10px] block font-semibold text-slate-400 uppercase">
                    Password
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                    {generatedCredentials.password}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(generatedCredentials.password, "password")}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition shrink-0 flex items-center gap-1"
                >
                  {copiedField === "password" ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <CheckCircleIcon className="w-3.5 h-3.5" /> Copiat
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <CopyIcon className="w-3.5 h-3.5" /> Copiază
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(cardHandoverText, "card")}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copiedField === "card" ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Mesaj Complet Copiat!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" />
                    <span>Copiază Tot (Pentru Părinți)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Gata / Închide
              </button>
            </div>
          </div>
        ) : lmsAccess?.hasAccess ? (
          /* Existing account status */
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Cont Activ în LMS</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Activ
                </span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Username / Email:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {lmsAccess.user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Platformă:</span>
                  <a
                    href="https://learn.brio.md"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 underline font-semibold"
                  >
                    learn.brio.md
                  </a>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Dacă elevul sau părintele a uitat parola, puteți genera o parolă nouă mai jos.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={provisionMutation.isPending}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {provisionMutation.isPending ? "Se resetează..." : "Resetează Parola"}
              </button>
            </div>
          </div>
        ) : (
          /* No account yet */
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-800">
                Niciun cont LMS asociat
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Elevul nu are încă acces creat pentru platforma <strong>learn.brio.md</strong>.
                Generați credențialele acum pentru a-i crea un cont dedicat de elev cu cursurile asignate.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={provisionMutation.isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                <KeyIcon className="w-3.5 h-3.5" />
                <span>
                  {provisionMutation.isPending
                    ? "Se generează..."
                    : "Generează Acces LMS"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
