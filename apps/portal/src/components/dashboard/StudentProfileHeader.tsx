"use client";

import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { ParentCallWidget } from "@/components/dashboard/ParentCallWidget";
import {
  PhoneIcon,
  CalendarIcon,
  SchoolIcon,
  StudentsIcon,
  ChevronLeftIcon,
} from "@/components/ui/icons";

export function StudentProfileStateScreen({
  iconBg,
  iconColor,
  title,
  message,
}: {
  iconBg: string;
  iconColor: string;
  title: string;
  message: string;
}) {
  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
      <div className={`w-12 h-12 rounded-full ${iconBg} ${iconColor} flex items-center justify-center mx-auto mb-3`}>
        <StudentsIcon className="w-6 h-6" />
      </div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{message}</p>
      <Link
        href="/dashboard/students"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Înapoi la catalog
      </Link>
    </div>
  );
}

export type StudentProfileHeaderProps = {
  student: {
    id: number;
    name: string;
    active: boolean | null;
    phone?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    age?: number | null;
    schoolName?: string | null;
    info?: string | null;
    createdAt?: string | Date | null;
  };
  balanceSummary?: {
    currentDebt: number;
    overdueCount: number;
  } | null;
  createdDateFormatted: string;
  onOpenBillingTab: () => void;
};

export function StudentProfileHeader({
  student,
  balanceSummary,
  createdDateFormatted,
  onOpenBillingTab,
}: StudentProfileHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="p-4 sm:p-8 bg-slate-50/60 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-xs">
              {student.name ? student.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {student.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    student.active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {student.active ? "Student Activ" : "Student Inactiv"}
                </span>

                {balanceSummary && (
                  <button
                    type="button"
                    onClick={onOpenBillingTab}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      balanceSummary.currentDebt > 0
                        ? balanceSummary.overdueCount > 0
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                    title="Vezi detalii financiare & facturi"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        balanceSummary.currentDebt > 0
                          ? balanceSummary.overdueCount > 0
                            ? "bg-rose-500 animate-pulse"
                            : "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <span>
                      {balanceSummary.currentDebt > 0
                        ? `Datorie: ${balanceSummary.currentDebt} MDL`
                        : "Fără restanțe"}
                    </span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {student.age ? `${student.age} ani` : "Vârstă Nespecificată"}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <SchoolIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.schoolName || "Campus Principal"}</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Înscris la {createdDateFormatted}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Direct Contact */}
        <div className="space-y-1.5 bg-slate-50/75 rounded-xl p-4 border border-slate-200/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Contact Student
          </span>
          {student.phone ? (
            <a
              href={`tel:${student.phone}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-slate-700 transition group"
            >
              <PhoneIcon className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
              <span>{formatPhone(student.phone)}</span>
            </a>
          ) : (
            <p className="text-xs text-slate-400 italic">Fără număr de telefon personal</p>
          )}
          <p className="text-[11px] text-slate-400">Apel direct sau WhatsApp</p>
        </div>

        {/* Parent / Guardian Contact */}
        <div className="space-y-2 bg-slate-50/75 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Părinte / Reprezentant Legal
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              Contact Primar
            </span>
          </div>
          <ParentCallWidget
            parentName={student.parentName}
            parentPhone={student.parentPhone}
          />
        </div>

        {/* Pedagogical Notes */}
        <div className="space-y-1.5 bg-slate-50/75 rounded-xl p-4 border border-slate-200/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Observații Pedagogice & Recomandări
          </span>
          <p className="text-xs text-slate-600 italic line-clamp-3">
            {student.info || "Nu sunt menționate notițe speciale pentru acest elev."}
          </p>
        </div>
      </div>
    </div>
  );
}
