"use client";

import { useState } from "react";
import { DownloadIcon, XIcon, InvoiceIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/ui/icons";
import type { DebtorsListItem } from "@/server/billingStatisticsService";

export type ExportCsvModalProps = {
  invoicesData?: Array<{
    invoiceNumber: string;
    studentName: string;
    studentPhone?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    groupName?: string | null;
    type: string;
    status: string;
    totalAmount: number;
    paidAmount?: number | null;
    dueDate?: string | null;
    createdAt?: Date | string | null;
  }>;
  paymentsData?: Array<{
    paymentDate: string;
    receiptNumber?: string | null;
    studentName?: string;
    invoiceNumber?: string;
    method: string;
    amount: number;
  }>;
  debtorsData?: DebtorsListItem[];
};

export function ExportCsvModal({
  invoicesData = [],
  paymentsData = [],
  debtorsData = [],
}: ExportCsvModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  function escapeCsvCell(val: unknown): string {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  function downloadCsvFile(filename: string, csvContent: string) {
    // Add UTF-8 BOM (\uFEFF) so Excel correctly displays Romanian diacritics
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const exportInvoicesCsv = () => {
    const headers = [
      "Număr Factură",
      "Elev",
      "Telefon Elev",
      "Părinte",
      "Telefon Părinte",
      "Grupă",
      "Tip Factură",
      "Status",
      "Total (MDL)",
      "Încasat (MDL)",
      "Restant (MDL)",
      "Data Scadenței",
    ];

    const rows = invoicesData.map((inv) => {
      const remaining = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));
      return [
        escapeCsvCell(inv.invoiceNumber),
        escapeCsvCell(inv.studentName),
        escapeCsvCell(inv.studentPhone || ""),
        escapeCsvCell(inv.parentName || ""),
        escapeCsvCell(inv.parentPhone || ""),
        escapeCsvCell(inv.groupName || ""),
        escapeCsvCell(inv.type),
        escapeCsvCell(inv.status),
        escapeCsvCell(inv.totalAmount),
        escapeCsvCell(inv.paidAmount || 0),
        escapeCsvCell(remaining),
        escapeCsvCell(inv.dueDate || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const today = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`raport-facturi-${today}.csv`, csvContent);
    setIsOpen(false);
  };

  const exportPaymentsCsv = () => {
    const headers = [
      "Data Plății",
      "Număr Chitanță",
      "Elev",
      "Număr Factură",
      "Metodă Plată",
      "Sumă Încasată (MDL)",
    ];

    const rows = paymentsData.map((p) => {
      return [
        escapeCsvCell(p.paymentDate),
        escapeCsvCell(p.receiptNumber || ""),
        escapeCsvCell(p.studentName || ""),
        escapeCsvCell(p.invoiceNumber || ""),
        escapeCsvCell(p.method),
        escapeCsvCell(p.amount),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const today = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`raport-incasari-${today}.csv`, csvContent);
    setIsOpen(false);
  };

  const exportDebtorsCsv = () => {
    const headers = [
      "Elev",
      "Telefon Elev",
      "Părinte",
      "Telefon Părinte",
      "Grupe Înscrise",
      "Facturi Neachitate",
      "Zile Întârziere",
      "Cea mai veche scadență",
      "Datorie Totală (MDL)",
    ];

    const rows = debtorsData.map((d) => {
      return [
        escapeCsvCell(d.studentName),
        escapeCsvCell(d.studentPhone || ""),
        escapeCsvCell(d.parentName || ""),
        escapeCsvCell(d.parentPhone || ""),
        escapeCsvCell(d.groupNames.join("; ")),
        escapeCsvCell(d.unpaidInvoicesCount),
        escapeCsvCell(d.overdueDays),
        escapeCsvCell(d.earliestDueDate || ""),
        escapeCsvCell(d.totalDebt),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const today = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`raport-restantieri-${today}.csv`, csvContent);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs hover:border-slate-300 transition-all active:scale-95"
      >
        <DownloadIcon className="w-4 h-4 text-slate-500" />
        <span>Exportă CSV</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DownloadIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Exportă Rapoarte Financiare CSV
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Format compatibil Excel & Numbers (cu caractere diacritice)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Export Options */}
            <div className="space-y-2.5 pt-2">
              {/* 1. Facturi */}
              <button
                type="button"
                onClick={exportInvoicesCsv}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                    <InvoiceIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Raport Registru Facturi
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {invoicesData.length} facturi înregistrate
                    </p>
                  </div>
                </div>
                <DownloadIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
              </button>

              {/* 2. Încasări */}
              <button
                type="button"
                onClick={exportPaymentsCsv}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Raport Încasări & Plăți
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {paymentsData.length} plăți înregistrate
                    </p>
                  </div>
                </div>
                <DownloadIcon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
              </button>

              {/* 3. Restanțieri */}
              <button
                type="button"
                onClick={exportDebtorsCsv}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                    <AlertTriangleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Raport Restanțieri (Top Restanțe)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {debtorsData.length} elevi cu solduri neachitate
                    </p>
                  </div>
                </div>
                <DownloadIcon className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
