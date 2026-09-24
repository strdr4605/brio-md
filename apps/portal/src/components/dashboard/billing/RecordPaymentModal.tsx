"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { XIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/ui/icons";

export type InvoiceOption = {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number | null;
  status: string;
  dueDate?: string | null;
  type?: string;
};

export type RecordPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  invoices: InvoiceOption[];
  initialInvoiceId?: number | null;
  onSuccess: () => void;
};

export function RecordPaymentModal({
  isOpen,
  onClose,
  studentId: _studentId,
  studentName,
  invoices,
  initialInvoiceId,
  onSuccess,
}: RecordPaymentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<"cash" | "bank_transfer" | "card" | "other">("cash");
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const payableInvoices = invoices.filter(
    (inv) => inv.status !== "paid" && inv.status !== "cancelled" && inv.status !== "draft",
  );

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setError(null);
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setReceiptNumber("");
      setNotes("");

      const targetId =
        initialInvoiceId && invoices.some((i) => i.id === initialInvoiceId)
          ? initialInvoiceId
          : payableInvoices[0]?.id || invoices[0]?.id || null;

      setSelectedInvoiceId(targetId);

      const targetInv = invoices.find((i) => i.id === targetId);
      if (targetInv) {
        const remaining = Math.max(0, targetInv.totalAmount - (targetInv.paidAmount || 0));
        setAmount(remaining.toString());
      } else {
        setAmount("");
      }
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialInvoiceId, invoices, payableInvoices]);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);
  const remainingBalance = selectedInvoice
    ? Math.max(0, selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0))
    : 0;

  const handleInvoiceChange = (invId: number) => {
    setSelectedInvoiceId(invId);
    setError(null);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      const remaining = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
      setAmount(remaining.toString());
    }
  };

  const recordPaymentMutation = trpc.billing.recordPayment.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message || "Eroare la înregistrarea plății.");
    },
  });

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedInvoiceId) {
      setError("Vă rugăm selectați o factură.");
      return;
    }

    if (!selectedInvoice) {
      setError("Factura selectată nu a fost găsită.");
      return;
    }

    if (selectedInvoice.status === "draft") {
      setError("Nu se pot înregistra plăți pentru facturi în ciornă. Emiteți factura mai întâi.");
      return;
    }

    if (selectedInvoice.status === "cancelled") {
      setError("Factura selectată este anulată.");
      return;
    }

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Suma plății trebuie să fie un număr pozitiv mai mare ca 0.");
      return;
    }

    if (parsedAmount > remainingBalance) {
      setError(`Suma plătită (${parsedAmount} MDL) depășește restanța rămasă (${remainingBalance} MDL).`);
      return;
    }

    recordPaymentMutation.mutate({
      invoiceId: selectedInvoiceId,
      amount: parsedAmount,
      method,
      paymentDate,
      receiptNumber: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Înregistrează Plată</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Elev: <span className="font-semibold text-slate-700">{studentName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            aria-label="Închide"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {invoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700">Nu există facturi pentru acest elev.</p>
                <p>Emiteți mai întâi o factură înainte de a înregistra o plată.</p>
              </div>
            ) : (
              <>
                {/* Select Invoice */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Factură asociată <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedInvoiceId || ""}
                    onChange={(e) => handleInvoiceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                    required
                  >
                    {invoices.map((inv) => {
                      const rem = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
                      const isPayable = inv.status !== "paid" && inv.status !== "cancelled" && inv.status !== "draft";
                      return (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} — {inv.totalAmount} MDL (Restant: {rem} MDL) [{inv.status}]
                          {!isPayable ? " (Neachitabil)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Invoice Snapshot Card */}
                {selectedInvoice && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Total Factură
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedInvoice.totalAmount} MDL
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Deja Achitat
                      </span>
                      <span className="font-bold text-emerald-600 text-sm">
                        {selectedInvoice.paidAmount || 0} MDL
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Restanță Curentă
                      </span>
                      <span
                        className={`font-bold text-sm ${
                          remainingBalance > 0 ? "text-rose-600" : "text-slate-400"
                        }`}
                      >
                        {remainingBalance} MDL
                      </span>
                    </div>
                  </div>
                )}

                {/* Amount and Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Suma de achitat (MDL) <span className="text-rose-500">*</span>
                      </label>
                      {remainingBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => setAmount(remainingBalance.toString())}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Suma integrală
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Metodă de plată <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value as "cash" | "bank_transfer" | "card" | "other")}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                    >
                      <option value="cash">Numerar (Cash)</option>
                      <option value="bank_transfer">Transfer bancar</option>
                      <option value="card">Card bancar / Terminal</option>
                      <option value="other">Altă metodă</option>
                    </select>
                  </div>
                </div>

                {/* Payment Date & Receipt Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Data plății <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Număr chitanță / Bon fiscal
                    </label>
                    <input
                      type="text"
                      placeholder="ex: BON-9281, CHIT-001"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Notițe / Comentariu plată
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalii suplimentare referitoare la tranzacție..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
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
              disabled={
                recordPaymentMutation.isPending ||
                invoices.length === 0 ||
                !selectedInvoiceId ||
                !amount
              }
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>{recordPaymentMutation.isPending ? "Se procesează..." : "Înregistrează Plată"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
