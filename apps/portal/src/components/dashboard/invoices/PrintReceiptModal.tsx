"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { XIcon } from "@/components/ui/icons";
import type { InvoiceRowData } from "./InvoicesTable";

export type PrintReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRowData | null;
};

export function PrintReceiptModal({ isOpen, onClose, invoice }: PrintReceiptModalProps) {
  const { data: school } = trpc.school.getDetails.useQuery(undefined, {
    enabled: isOpen && !!invoice,
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !invoice) return null;

  const total = invoice.totalAmount ?? 0;
  const paid = invoice.paidAmount ?? 0;
  const balance = Math.max(0, total - paid);

  const formatMdl = (num: number) => {
    return new Intl.NumberFormat("ro-MD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden print:shadow-none print:rounded-none print:max-w-none print:w-full print:m-0 border border-slate-200/80 print:border-none">
        {/* Modal Toolbar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-base">🖨️</span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Previzualizare Chitanță & Factură
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Tipărește / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (A4-proportioned layout) */}
        <div id="printable-receipt" className="p-8 sm:p-10 space-y-8 bg-white text-slate-900">
          {/* Header Branding & Issuer */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  V
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  {school?.name || "Vibe Academy"}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                {school?.address && <p>{school.address}</p>}
                {school?.phone && <p>Tel: {school.phone}</p>}
                {school?.email && <p>Email: {school.email}</p>}
                {school?.fiscalCode && <p className="font-mono">IDNO / Cod Fiscal: {school.fiscalCode}</p>}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 mb-1">
                Chitanță de Plată
              </span>
              <p className="font-mono font-bold text-sm text-slate-900">
                {invoice.invoiceNumber || `#INV-${invoice.id}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">Data: {formatDate(invoice.createdAt)}</p>
              <p className="text-xs text-slate-500">Scadență: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Student & Course Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Beneficiar Servicii (Elev)
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{invoice.studentName}</p>
              {invoice.studentPhone && (
                <p className="text-slate-500 mt-0.5 font-mono">{invoice.studentPhone}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Grupă & Format
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {invoice.groupName || "Servicii Educaționale"}
              </p>
              <p className="text-slate-500 mt-0.5 capitalize">
                Tip: {invoice.type === "subscription" ? "Abonament lunar" : invoice.type}
              </p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Descriere Serviciu</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Sumă (MDL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">
                      Taxă școlarizare / instruire ({invoice.groupName || "Curs IT"})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Perioada conform contractului de studii
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        invoice.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : invoice.status === "overdue"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {invoice.status === "paid" ? "Achitat" : invoice.status === "overdue" ? "Restant" : "Emis"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatMdl(total)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-1.5 text-xs text-right">
              <div className="flex justify-between sm:justify-end sm:gap-8 text-slate-600">
                <span>Total Facturat:</span>
                <span className="font-mono font-bold">{formatMdl(total)} MDL</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-8 text-slate-600">
                <span>Achitat Până în Prezent:</span>
                <span className="font-mono font-bold text-emerald-700">{formatMdl(paid)} MDL</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-8 text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Sold Rămas de Plată:</span>
                <span className="font-mono">{formatMdl(balance)} MDL</span>
              </div>
            </div>
          </div>

          {/* Payment & Bank Details (for transfer) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block">
              Instrucțiuni & Rechizite Bancare pentru Transfer
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Banca Beneficiară:</span>
                <span className="font-semibold">{school?.bankName || "B.C. Moldova Agroindbank S.A."}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Cont IBAN:</span>
                <span className="font-mono font-bold text-slate-900 uppercase">
                  {school?.iban || "MD24AG0000000000000000"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Cod Fiscal Beneficiar:</span>
                <span className="font-mono font-semibold">{school?.fiscalCode || "1002600000000"}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Destinația Plății:</span>
                <span className="font-semibold text-slate-900">
                  Factura {invoice.invoiceNumber || invoice.id}, {invoice.studentName}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Emis de Administrație:</p>
              <div className="mt-8 border-b border-slate-300 w-36" />
              <p className="text-[10px] mt-1 text-slate-400">Semnătură / Ștampilă</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-700">Semnătură Plătitor / Părinte:</p>
              <div className="mt-8 border-b border-slate-300 w-36 ml-auto" />
              <p className="text-[10px] mt-1 text-slate-400">Confirmare de primire</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
