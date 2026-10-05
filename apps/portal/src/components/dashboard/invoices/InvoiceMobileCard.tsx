"use client";

import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { PhoneIcon } from "@/components/ui/icons";
import type { InvoiceRowData } from "./InvoicesTable";

export type InvoiceMobileCardProps = {
  invoice: InvoiceRowData;
  isOverdue: boolean;
  statusBadge: React.ReactNode;
  typeBadge: React.ReactNode;
  formatMdl: (amount: number) => string;
  formatDate: (dateStr?: string | Date | null) => string;
  onRecordPayment?: (invoice: InvoiceRowData) => void;
  onCancelInvoice?: (invoice: InvoiceRowData) => void;
};

export function InvoiceMobileCard({
  invoice,
  isOverdue,
  statusBadge,
  typeBadge,
  formatMdl,
  formatDate,
  onRecordPayment,
  onCancelInvoice,
}: InvoiceMobileCardProps) {
  const total = invoice.totalAmount ?? 0;
  const paid = invoice.paidAmount ?? 0;
  const balance = Math.max(0, total - paid);
  const canPay = invoice.status !== "paid" && invoice.status !== "cancelled" && balance > 0;
  const canCancel = invoice.status !== "paid" && invoice.status !== "cancelled";

  return (
    <div
      className={`p-4 transition-colors ${
        isOverdue ? "bg-rose-50/20" : "bg-white"
      }`}
    >
      <div className="space-y-3">
        {/* Top line: Invoice number + Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-slate-900 text-sm">
              {invoice.invoiceNumber || `#INV-${invoice.id}`}
            </span>
            <span className="text-[11px] text-slate-400">
              {formatDate(invoice.createdAt)}
            </span>
          </div>
          <div>{statusBadge}</div>
        </div>

        {/* Student Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/dashboard/students/${invoice.studentId}`}
              className="font-bold text-slate-900 text-sm hover:text-slate-600 block truncate"
            >
              {invoice.studentName}
            </Link>
            {invoice.studentPhone && (
              <a
                href={`tel:${invoice.studentPhone}`}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mt-0.5 active:scale-95 transition"
              >
                <PhoneIcon className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{formatPhone(invoice.studentPhone)}</span>
              </a>
            )}
          </div>

          <div className="text-right shrink-0">
            {typeBadge}
          </div>
        </div>

        {/* Group & Due Date */}
        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 rounded-xl p-2.5">
          <div className="truncate max-w-[170px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Grupă</span>
            <span className="font-medium text-slate-700 truncate">
              {invoice.groupName || "General"}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Scadență</span>
            <span className={isOverdue ? "text-rose-600 font-bold" : "font-medium text-slate-700"}>
              {formatDate(invoice.dueDate)}
            </span>
          </div>
        </div>

        {/* Financial Row */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Factură</span>
            <span className="font-black text-slate-900 text-base">
              {formatMdl(total)}{" "}
              <span className="text-xs font-normal text-slate-400">MDL</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Rest de plată</span>
            {balance === 0 ? (
              <span className="text-xs font-bold text-emerald-700">Achitat integral</span>
            ) : paid > 0 ? (
              <span className="text-xs font-bold text-amber-800">
                {formatMdl(balance)} MDL
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-700">
                {formatMdl(balance)} MDL
              </span>
            )}
          </div>
        </div>

        {/* Actions Row */}
        {(canPay || canCancel) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            {canPay && onRecordPayment && (
              <button
                type="button"
                onClick={() => onRecordPayment(invoice)}
                className="flex-1 py-2 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all active:scale-[0.98] text-center"
              >
                Înregistrează Plată
              </button>
            )}

            {canCancel && onCancelInvoice && (
              <button
                type="button"
                onClick={() => onCancelInvoice(invoice)}
                className="py-2 px-3 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-100 rounded-xl transition-all active:scale-[0.98] text-center"
              >
                Anulează
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
