"use client";

import Link from "next/link";
import type { DebtorsListItem } from "@/server/billingStatisticsService";
import { ParentCallWidget } from "@/components/dashboard/ParentCallWidget";
import { ChevronRightIcon, AlertTriangleIcon } from "@/components/ui/icons";

export type DebtorTableRowProps = {
  debtor: DebtorsListItem;
  formatMdl: (amount: number) => string;
};

export function DebtorTableRow({
  debtor,
  formatMdl,
}: DebtorTableRowProps) {
  const isOverdue = debtor.overdueDays > 0;
  const isSevere = debtor.overdueDays > 14;

  return (
    <tr className="hover:bg-slate-50/70 transition-colors group">
      {/* Student Name & Direct Profile Link */}
      <td className="py-3.5 px-3">
        <Link
          href={`/dashboard/students/${debtor.studentId}`}
          className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5"
        >
          <span>{debtor.studentName}</span>
          <ChevronRightIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
        </Link>
        {debtor.studentPhone && (
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {debtor.studentPhone}
          </p>
        )}
      </td>

      {/* Groups */}
      <td className="py-3.5 px-3">
        {debtor.groupNames.length === 0 ? (
          <span className="text-slate-400 italic">Fără grupă</span>
        ) : (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {debtor.groupNames.map((g: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </td>

      {/* Parent Contact & ParentCallWidget */}
      <td className="py-3.5 px-3">
        <ParentCallWidget
          parentName={debtor.parentName}
          parentPhone={debtor.parentPhone}
          compact={true}
        />
      </td>

      {/* Unpaid Invoices Count */}
      <td className="py-3.5 px-3 text-center">
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
          {debtor.unpaidInvoicesCount}
        </span>
      </td>

      {/* Overdue Duration */}
      <td className="py-3.5 px-3">
        {isOverdue ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
              isSevere
                ? "bg-rose-50/80 text-rose-700 border border-rose-200/60"
                : "bg-amber-50/80 text-amber-700 border border-amber-200/60"
            }`}
          >
            <AlertTriangleIcon className="w-3 h-3 shrink-0" />
            <span>{debtor.overdueDays} zile</span>
          </span>
        ) : (
          <span className="text-slate-400 text-[11px] font-medium">
            În termen (0 zile)
          </span>
        )}
        {debtor.earliestDueDate && (
          <p className="text-[10px] text-slate-400 mt-0.5">
            Scadență: {debtor.earliestDueDate}
          </p>
        )}
      </td>

      {/* Total Debt */}
      <td className="py-3.5 px-3 text-right">
        <span className="text-sm font-black text-rose-600 tracking-tight tabular-nums">
          {formatMdl(debtor.totalDebt)}
        </span>
        <span className="text-[10px] font-bold text-slate-500 ml-1">MDL</span>
      </td>

      {/* Actions */}
      <td className="py-3.5 px-3 text-right">
        <Link
          href={`/dashboard/students/${debtor.studentId}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition"
        >
          <span>Fișă Elev</span>
        </Link>
      </td>
    </tr>
  );
}
