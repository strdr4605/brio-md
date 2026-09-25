"use client";

import { useState } from "react";
import Link from "next/link";

export type StudentBillingProps = {
  billing?: {
    billingType: "subscription_monthly" | "subscription_course" | "per_lesson" | "custom";
    customPrice?: number | null;
    discountPercent?: number | null;
    finalPrice?: number | null;
    hasDebt: boolean;
    debtAmount: number;
    isOverdue: boolean;
    currentMonthStatus: "paid" | "partially_paid" | "unpaid" | "no_invoice";
    currentMonthInvoiceId?: number | null;
    currentMonthInvoiceNumber?: string | null;
    currentMonthDueDate?: string | null;
    currentMonthTotalAmount?: number | null;
    currentMonthPaidAmount?: number | null;
    overdueCount?: number;
  };
  studentName?: string;
  compact?: boolean;
};

export function StudentBillingBadge({
  billing,
  studentName = "Elev",
  compact = false,
}: StudentBillingProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!billing) return null;

  const {
    billingType,
    hasDebt,
    debtAmount,
    isOverdue,
    currentMonthStatus,
    finalPrice,
    currentMonthInvoiceNumber,
    currentMonthDueDate,
    overdueCount = 0,
  } = billing;

  // Determine label & color variant
  let badgeLabel = "";
  let badgeClasses = "";

  if (hasDebt || isOverdue) {
    badgeClasses =
      "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-extrabold shadow-2xs";
    if (debtAmount > 0) {
      badgeLabel = compact ? `-${debtAmount}L` : `Restanță: ${debtAmount} MDL`;
    } else if (isOverdue) {
      badgeLabel = compact ? "Restant" : "Factură restantă";
    } else {
      badgeLabel = compact ? "Neachitat" : "Neachitat luna curentă";
    }
  } else if (currentMonthStatus === "paid") {
    badgeClasses =
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold";
    badgeLabel = compact ? "Achitat" : "Abonament ✓";
  } else if (billingType === "per_lesson") {
    badgeClasses =
      "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-bold";
    badgeLabel = "Per lecție";
  } else if (currentMonthStatus === "no_invoice") {
    badgeClasses =
      "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 font-semibold";
    badgeLabel = compact ? "Fără factură" : "Abonament (fără factură)";
  } else {
    badgeClasses =
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-bold";
    badgeLabel = compact ? "În așteptare" : "Plată în așteptare";
  }

  const typeLabels: Record<string, string> = {
    subscription_monthly: "Abonament lunar",
    subscription_course: "Abonament curs complet",
    per_lesson: "Plată per lecție",
    custom: "Plan personalizat",
  };

  return (
    <div
      data-brio-id="billing-badge"
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip((prev) => !prev);
        }}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] border transition-all cursor-pointer select-none ${badgeClasses}`}
        title={`Status financiar: ${studentName}`}
      >
        {hasDebt && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse shrink-0" />}
        {currentMonthStatus === "paid" && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
        )}
        <span className="truncate max-w-[130px]">{badgeLabel}</span>
      </button>

      {/* Floating Tooltip Card */}
      {showTooltip && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-64 p-3 bg-white/98 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl text-left text-xs animate-fade-in pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="font-extrabold text-slate-800 text-[11px] truncate max-w-[180px]">
              {studentName}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                hasDebt
                  ? "bg-rose-100 text-rose-800"
                  : currentMonthStatus === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {hasDebt ? "Restanță" : currentMonthStatus === "paid" ? "Achitat" : "Activ"}
            </span>
          </div>

          <div className="py-2 space-y-1.5 text-[11px] text-slate-600">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Plan tarifar:</span>
              <span className="font-bold text-slate-700">
                {typeLabels[billingType] || billingType}
              </span>
            </div>

            {finalPrice != null && finalPrice > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tarif stabilit:</span>
                <span className="font-extrabold text-slate-800">
                  {finalPrice} MDL
                  {billing.discountPercent ? (
                    <span className="text-emerald-600 text-[10px] ml-1">
                      (-{billing.discountPercent}%)
                    </span>
                  ) : null}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Luna curentă:</span>
              <span
                className={`font-bold ${
                  currentMonthStatus === "paid"
                    ? "text-emerald-700"
                    : currentMonthStatus === "unpaid"
                      ? "text-rose-700"
                      : currentMonthStatus === "partially_paid"
                        ? "text-amber-700"
                        : "text-slate-500"
                }`}
              >
                {currentMonthStatus === "paid"
                  ? "Achitat"
                  : currentMonthStatus === "unpaid"
                    ? "Neachitat"
                    : currentMonthStatus === "partially_paid"
                      ? "Achitat parțial"
                      : "Fără factură emisă"}
              </span>
            </div>

            {currentMonthInvoiceNumber && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Factură:</span>
                <span className="font-mono text-[10px] text-slate-700 font-bold">
                  {currentMonthInvoiceNumber}
                </span>
              </div>
            )}

            {currentMonthDueDate && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Scadență:</span>
                <span className={`text-[10px] font-bold ${isOverdue ? "text-rose-600" : "text-slate-700"}`}>
                  {currentMonthDueDate}
                </span>
              </div>
            )}

            <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Total datorie:</span>
              <span
                className={`text-xs font-black ${
                  debtAmount > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {debtAmount > 0 ? `${debtAmount} MDL` : "0 MDL (La zi)"}
              </span>
            </div>

            {overdueCount > 0 && (
              <div className="text-[10px] text-rose-600 font-bold">
                ⚠️ {overdueCount} factur{overdueCount === 1 ? "ă depășită" : "i depășite"} ca termen
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              href={`/dashboard/invoices?search=${encodeURIComponent(studentName)}`}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Registru Facturi →
            </Link>
            <span className="text-[9px] text-slate-400">Esc pentru a închide</span>
          </div>
        </div>
      )}
    </div>
  );
}
