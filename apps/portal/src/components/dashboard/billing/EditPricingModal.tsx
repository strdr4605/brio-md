"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { XIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/ui/icons";

export type EditPricingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: number;
  groupName: string;
  courseName?: string | null;
  initialBillingType?: string | null;
  initialCustomPrice?: number | null;
  initialDiscountPercent?: number | null;
  onSuccess: () => void;
};

export function EditPricingModal({
  isOpen,
  onClose,
  enrollmentId,
  groupName,
  courseName,
  initialBillingType,
  initialCustomPrice,
  initialDiscountPercent,
  onSuccess,
}: EditPricingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [billingType, setBillingType] = useState<"subscription_monthly" | "subscription_course" | "per_lesson" | "custom">("subscription_monthly");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setBillingType((initialBillingType as any) || "subscription_monthly");
      setCustomPrice(initialCustomPrice != null ? initialCustomPrice.toString() : "");
      setDiscountPercent(initialDiscountPercent != null ? initialDiscountPercent.toString() : "0");
    }
  }, [isOpen, initialBillingType, initialCustomPrice, initialDiscountPercent]);

  const updatePricingMutation = trpc.enrollment.updatePricing.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message || "Eroare la actualizarea tarifului.");
    },
  });

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = customPrice.trim() ? Math.max(0, parseInt(customPrice, 10)) : null;
    const parsedDiscount = discountPercent.trim()
      ? Math.min(100, Math.max(0, parseInt(discountPercent, 10)))
      : 0;

    updatePricingMutation.mutate({
      enrollmentId,
      billingType,
      customPrice: parsedPrice,
      discountPercent: parsedDiscount,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Configurare Tarif Înrolare</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grupă: <strong className="text-slate-800">{groupName}</strong>{" "}
              {courseName ? `(${courseName})` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangleIcon className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Model de facturare <span className="text-rose-500">*</span>
              </label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              >
                <option value="subscription_monthly">Abonament lunar</option>
                <option value="per_lesson">Plată per lecție</option>
                <option value="subscription_course">Abonament curs complet</option>
                <option value="custom">Personalizat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Preț personalizat (MDL)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Lasă gol pentru preț implicit curs"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reducere individuală (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={updatePricingMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>{updatePricingMutation.isPending ? "Se salvează..." : "Salvează Tarif"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
