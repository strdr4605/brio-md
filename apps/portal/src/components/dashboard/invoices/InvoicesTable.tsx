"use client";

import { InvoiceIcon, AlertTriangleIcon, CheckCircleIcon } from "@/components/ui/icons";
import { InvoiceMobileCard } from "./InvoiceMobileCard";
import { InvoiceDesktopTable } from "./InvoiceDesktopTable";

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
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
            Abonament
          </span>
        );
      case "per_lesson":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
            Per lecție
          </span>
        );
      case "situational":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200/80">
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
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
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
      {/* Mobile Card List (Thumb-friendly touch view) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {invoices.map((inv) => (
          <InvoiceMobileCard
            key={inv.id}
            invoice={inv}
            isOverdue={isOverdue(inv)}
            statusBadge={getStatusBadge(inv)}
            typeBadge={getTypeBadge(inv.type)}
            formatMdl={formatMdl}
            formatDate={formatDate}
            onRecordPayment={onRecordPayment}
            onCancelInvoice={onCancelInvoice}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <InvoiceDesktopTable
          invoices={invoices}
          formatMdl={formatMdl}
          formatDate={formatDate}
          isOverdue={isOverdue}
          getTypeBadge={getTypeBadge}
          getStatusBadge={getStatusBadge}
          onRecordPayment={onRecordPayment}
          onCancelInvoice={onCancelInvoice}
        />
      </div>
    </div>
  );
}
