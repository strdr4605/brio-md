"use client";

import { ExportCsvModal } from "@/components/dashboard/invoices/ExportCsvModal";
import type { DebtorsListItem } from "@/server/billingStatisticsService";

export type DatePreset = "mtd" | "ytd" | "custom";

export type FinancialStatisticsHeaderProps = {
  preset: DatePreset;
  setPreset: (preset: DatePreset) => void;
  customFrom: string;
  setCustomFrom: (val: string) => void;
  customTo: string;
  setCustomTo: (val: string) => void;
  rawInvoices: any[];
  paymentsCsvData: any[];
  debtorsData: DebtorsListItem[];
};

export function FinancialStatisticsHeader({
  preset,
  setPreset,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  rawInvoices,
  paymentsCsvData,
  debtorsData,
}: FinancialStatisticsHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Page Header with Temporal Filters and CSV Export */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Statistici Financiare & Restanțieri
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitorizează indicatorii de încasare, veniturile recurente și gestionează restanțele elevilor.
          </p>
        </div>

        {/* Right: Temporal Presets & CSV Export */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {/* Date Presets Segmented Control */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 shadow-xs">
            <button
              type="button"
              onClick={() => setPreset("mtd")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === "mtd"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Luna Curentă
            </button>
            <button
              type="button"
              onClick={() => setPreset("ytd")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === "ytd"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Anul Curent
            </button>
            <button
              type="button"
              onClick={() => setPreset("custom")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === "custom"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Personalizat
            </button>
          </div>

          {/* Export CSV Modal Button */}
          <ExportCsvModal
            invoicesData={rawInvoices}
            paymentsData={paymentsCsvData}
            debtorsData={debtorsData}
          />
        </div>
      </div>

      {/* Custom Date Range Picker Fields */}
      {preset === "custom" && (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3 animate-fade-in text-xs">
          <span className="font-bold text-slate-900">Alege intervalul:</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">De la:</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">Până la:</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
