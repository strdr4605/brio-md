"use client";

import { useState, useEffect } from "react";
import { InvoiceRowData } from "./InvoicesTable";
import { AlertTriangleIcon } from "@/components/ui/icons";

export type CancelInvoiceModalProps = {
  invoice: InvoiceRowData | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (invoice: InvoiceRowData, reason: string) => void;
};

export function CancelInvoiceModal({
  invoice,
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}: CancelInvoiceModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("Eroare de emitere / Anulare administrativă");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Introduceți motivul anulării facturii.");
      return;
    }
    onConfirm(invoice, reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-invoice-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-slate-200/80 transform transition-all">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangleIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 id="cancel-invoice-title" className="text-base font-bold text-slate-900">
              Anulare Factură
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sunteți pe cale să anulați factura{" "}
              <span className="font-mono font-bold text-slate-700">
                {invoice.invoiceNumber || `#${invoice.id}`}
              </span>{" "}
              pentru <span className="font-semibold text-slate-700">{invoice.studentName}</span>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Motivul anulării <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex: Factură duplicată, recalculare ore, renunțare curs..."
              className={`w-full text-xs rounded-xl border px-3 py-2.5 outline-hidden transition focus:ring-2 focus:ring-rose-500/20 ${
                error
                  ? "border-rose-300 focus:border-rose-500"
                  : "border-slate-200 focus:border-rose-500"
              }`}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-[11px] text-rose-600 font-medium mt-1">{error}</p>}
          </div>

          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
            Această acțiune este ireversibilă. Factura va fi marcată ca <strong>Anulată</strong> și nu va mai genera datorii active.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Renunță
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              {isLoading ? "Se anulează..." : "Confirmă Anularea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
