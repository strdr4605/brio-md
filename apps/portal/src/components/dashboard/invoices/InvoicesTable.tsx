"use client";

import Link from "next/link";
import { InvoiceIcon, AlertTriangleIcon, CheckCircleIcon } from "@/components/ui/icons";

export type InvoiceRowData = {
  id: number;
  invoiceNumber: string;
  studentId: number;
  studentName: string;
  studentPhone?: string | null;
  groupId?: number | null;
  groupName?: string | null;
  type: "subscription" | "per_lesson" | "situational";
  status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
  totalAmount: number | null;
  paidAmount: number | null;
  dueDate?: string | null;
  createdAt?: Date | string | null;
};

export type InvoicesTableProps = {
  invoices: InvoiceRowData[];
  isLoading?: boolean;
  onRecordPayment?: (invoice: InvoiceRowData) => void;
  onCancelInvoice?: (invoice: InvoiceRowData) => void;
};

export function InvoicesTable({
  invoices,
  isLoading = false,
  onRecordPayment,
  onCancelInvoice,
}: InvoicesTableProps) {
  const formatMdl = (amount: number) => {
    return new Intl.NumberFormat("ro-MD", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isOverdue = (invoice: InvoiceRowData) => {
    if (invoice.status === "paid" || invoice.status === "cancelled") return false;
    if (invoice.status === "overdue") return true;
    if (invoice.dueDate) {
      const todayStr = new Date().toISOString().slice(0, 10);
      return invoice.dueDate < todayStr;
    }
    return false;
  };

  const getTypeBadge = (type: InvoiceRowData["type"]) => {
    switch (type) {
      case "subscription":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Abonament
          </span>
        );
      case "per_lesson":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Per lecție
          </span>
        );
      case "situational":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            Situativ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (invoice: InvoiceRowData) => {
    const overdue = isOverdue(invoice);

    if (invoice.status === "paid") {
      return (
        <span
          data-testid="invoice-status-badge"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
        >
          <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
          <span>Achitată</span>
        </span>
      );
    }

    if (overdue || invoice.status === "overdue") {
      return (
        <span
          data-testid="invoice-status-badge"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
        >
          <AlertTriangleIcon className="w-3 h-3 text-rose-600" />
          <span>Restantă</span>
        </span>
      );
    }

    if (invoice.status === "partially_paid") {
      return (
        <span
          data-testid="invoice-status-badge"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Parțial achitată</span>
        </span>
      );
    }

    if (invoice.status === "cancelled") {
      return (
        <span
          data-testid="invoice-status-badge"
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 line-through"
        >
          Anulată
        </span>
      );
    }

    if (invoice.status === "draft") {
      return (
        <span
          data-testid="invoice-status-badge"
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
        >
          Ciornă
        </span>
      );
    }

    return (
      <span
        data-testid="invoice-status-badge"
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"
      >
        Emisă
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Se încarcă registrul de facturi...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
          <InvoiceIcon className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Nicio factură găsită</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Nu există facturi care să corespundă criteriilor de căutare sau filtrelor selectate.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Factură</th>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Grupă</th>
              <th className="py-3 px-4">Tip</th>
              <th className="py-3 px-4">Scadență</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-right">Achitat</th>
              <th className="py-3 px-4 text-right">Rest de plată</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {invoices.map((inv) => {
              const total = inv.totalAmount ?? 0;
              const paid = inv.paidAmount ?? 0;
              const balance = Math.max(0, total - paid);
              const overdue = isOverdue(inv);
              const canPay = inv.status !== "paid" && inv.status !== "cancelled" && balance > 0;
              const canCancel = inv.status !== "paid" && inv.status !== "cancelled";

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
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                    >
                      {inv.studentName}
                    </Link>
                    {inv.studentPhone && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {inv.studentPhone}
                      </span>
                    )}
                  </td>

                  {/* Grupă */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {inv.groupName ? (
                      <span className="font-semibold text-slate-700">{inv.groupName}</span>
                    ) : (
                      <span className="text-slate-400 italic">General</span>
                    )}
                  </td>

                  {/* Tip */}
                  <td className="py-3.5 px-4 whitespace-nowrap">{getTypeBadge(inv.type)}</td>

                  {/* Scadență */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                    <span className={overdue ? "text-rose-600 font-bold" : "text-slate-600"}>
                      {formatDate(inv.dueDate)}
                    </span>
                    {overdue && (
                      <span className="block text-[10px] text-rose-500 font-semibold mt-0.5">
                        Expirat
                      </span>
                    )}
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatMdl(total)}{" "}
                    <span className="text-[10px] font-normal text-slate-400">MDL</span>
                  </td>

                  {/* Achitat */}
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                    {formatMdl(paid)}{" "}
                    <span className="text-[10px] font-normal text-slate-400">MDL</span>
                  </td>

                  {/* Rest de plată */}
                  <td className="py-3.5 px-4 text-right font-black whitespace-nowrap">
                    <span className={balance > 0 ? "text-amber-700 font-bold" : "text-slate-400"}>
                      {formatMdl(balance)}{" "}
                      <span className="text-[10px] font-normal text-slate-400">MDL</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(inv)}
                  </td>

                  {/* Acțiuni */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center justify-start gap-1.5">
                      {canPay && onRecordPayment && (
                        <button
                          type="button"
                          onClick={() => onRecordPayment(inv)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          Achită
                        </button>
                      )}

                      {canCancel && onCancelInvoice && (
                        <button
                          type="button"
                          onClick={() => onCancelInvoice(inv)}
                          className="px-2 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
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
    </div>
  );
}
