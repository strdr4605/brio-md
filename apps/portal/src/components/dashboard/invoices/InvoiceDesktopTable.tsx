"use client";

import Link from "next/link";
import type { InvoiceRowData } from "./InvoicesTable";

export type InvoiceDesktopTableProps = {
  invoices: InvoiceRowData[];
  formatMdl: (amount: number) => string;
  formatDate: (dateStr?: string | Date | null) => string;
  isOverdue: (invoice: InvoiceRowData) => boolean;
  getTypeBadge: (type: InvoiceRowData["type"]) => React.ReactNode;
  getStatusBadge: (invoice: InvoiceRowData) => React.ReactNode;
  onRecordPayment?: (invoice: InvoiceRowData) => void;
  onCancelInvoice?: (invoice: InvoiceRowData) => void;
};

export function InvoiceDesktopTable({
  invoices,
  formatMdl,
  formatDate,
  isOverdue,
  getTypeBadge,
  getStatusBadge,
  onRecordPayment,
  onCancelInvoice,
}: InvoiceDesktopTableProps) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
            <th className="py-3 px-4">Factură</th>
            <th className="py-3 px-4">Student</th>
            <th className="py-3 px-4">Grupă & Tip</th>
            <th className="py-3 px-4">Scadență</th>
            <th className="py-3 px-4 text-right">Sumă & Sold</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-right">Acțiuni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {invoices.map((inv) => {
            const total = inv.totalAmount ?? 0;
            const paid = inv.paidAmount ?? 0;
            const balance = Math.max(0, total - paid);
            const overdue = isOverdue(inv);
            const canPay =
              inv.status !== "paid" &&
              inv.status !== "cancelled" &&
              balance > 0;
            const canCancel =
              inv.status !== "paid" && inv.status !== "cancelled";

            return (
              <tr
                key={inv.id}
                className={`hover:bg-slate-50/80 transition-colors ${
                  overdue ? "bg-rose-50/20" : ""
                }`}
              >
                {/* Factură */}
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                  <div>{inv.invoiceNumber || `#INV-${inv.id}`}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                    {formatDate(inv.createdAt)}
                  </div>
                </td>

                {/* Student */}
                <td className="py-3.5 px-4">
                  <Link
                    href={`/dashboard/students/${inv.studentId}`}
                    className="font-bold text-slate-900 hover:text-slate-600 transition-colors block"
                  >
                    {inv.studentName}
                  </Link>
                  {inv.studentPhone && (
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {inv.studentPhone}
                    </span>
                  )}
                </td>

                {/* Grupă & Tip */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-700 truncate max-w-[200px]">
                    {inv.groupName || (
                      <span className="text-slate-400 italic">General</span>
                    )}
                  </div>
                  <div className="mt-1">{getTypeBadge(inv.type)}</div>
                </td>

                {/* Scadență */}
                <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                  <span
                    className={
                      overdue ? "text-rose-600 font-bold" : "text-slate-600"
                    }
                  >
                    {formatDate(inv.dueDate)}
                  </span>
                  {overdue && (
                    <span className="block text-[10px] text-rose-500 font-semibold mt-0.5">
                      Expirat
                    </span>
                  )}
                </td>

                {/* Sumă & Sold */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="font-black text-slate-900 text-sm">
                    {formatMdl(total)}{" "}
                    <span className="text-[10px] font-normal text-slate-400">
                      MDL
                    </span>
                  </div>
                  <div className="text-[11px] mt-0.5">
                    {balance === 0 ? (
                      <span className="text-emerald-700 font-semibold">
                        Achitat integral
                      </span>
                    ) : paid > 0 ? (
                      <span className="text-amber-800 font-semibold">
                        Rest: {formatMdl(balance)} MDL
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Rest: {formatMdl(balance)} MDL
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  {getStatusBadge(inv)}
                </td>

                {/* Acțiuni */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {canPay && onRecordPayment && (
                      <button
                        type="button"
                        onClick={() => onRecordPayment(inv)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shrink-0"
                      >
                        Achită
                      </button>
                    )}

                    {canCancel && onCancelInvoice && (
                      <button
                        type="button"
                        onClick={() => onCancelInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-100 rounded-lg transition-colors shrink-0"
                      >
                        Anulează
                      </button>
                    )}

                    {!canPay && !canCancel && (
                      <span className="text-slate-400 font-medium">—</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
