"use client";

export type BillingConfigProps = {
  billingType: "subscription_monthly" | "subscription_course" | "per_lesson" | "custom";
  setBillingType: (val: "subscription_monthly" | "subscription_course" | "per_lesson" | "custom") => void;
  customPrice: string;
  setCustomPrice: (val: string) => void;
  discountPercent: string;
  setDiscountPercent: (val: string) => void;
};

export function EnrollmentBillingConfig({
  billingType,
  setBillingType,
  customPrice,
  setCustomPrice,
  discountPercent,
  setDiscountPercent,
}: BillingConfigProps) {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Configurare Facturare & Tarif
        </h3>
        <span className="text-[11px] text-slate-500 font-medium">pentru noile înrolări</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Model facturare
          </label>
          <select
            value={billingType}
            onChange={(e) => setBillingType(e.target.value as any)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium text-slate-800"
          >
            <option value="subscription_monthly">Abonament lunar</option>
            <option value="per_lesson">Plată per lecție</option>
            <option value="subscription_course">Abonament curs complet</option>
            <option value="custom">Personalizat</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Preț personalizat (MDL)
          </label>
          <input
            type="number"
            min="0"
            placeholder="Preț implicit curs"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Reducere (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="0%"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800"
          />
        </div>
      </div>
    </div>
  );
}
