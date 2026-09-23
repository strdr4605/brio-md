"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { XIcon, PlusIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/ui/icons";

export type GroupOption = {
  id: number;
  name: string;
  courseName?: string | null;
};

export type CreateSituationalInvoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  groups: GroupOption[];
  onSuccess: () => void;
};

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

const PRESET_CATEGORIES = [
  { label: "Materiale didactice / Manuale", price: 350 },
  { label: "Taxă examinare / Certificare", price: 500 },
  { label: "Lecție privată / Consultație", price: 300 },
  { label: "Taxă înscriere / Echipament", price: 200 },
  { label: "Ajustare sold / Serviciu adițional", price: 150 },
];

export function CreateSituationalInvoiceModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  groups,
  onSuccess,
}: CreateSituationalInvoiceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<LineItem[]>([
    {
      id: "item-1",
      description: "Materiale didactice curs",
      quantity: 1,
      unitPrice: 350,
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().slice(0, 10));
      setSelectedGroupId(groups[0]?.id || null);
      setNotes("");
      setItems([
        {
          id: `item-${Date.now()}`,
          description: "Materiale didactice curs",
          quantity: 1,
          unitPrice: 350,
        },
      ]);
    }
  }, [isOpen, groups]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        description: "",
        quantity: 1,
        unitPrice: 100,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof Omit<LineItem, "id">,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, [field]: value };
      }),
    );
  };

  const handleApplyPreset = (preset: { label: string; price: number }) => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        description: preset.label,
        quantity: 1,
        unitPrice: preset.price,
      },
    ]);
  };

  const totalAmount = items.reduce(
    (sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0),
    0,
  );

  const createInvoiceMutation = trpc.billing.createInvoice.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message || "Eroare la crearea facturii situative.");
    },
  });

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((it) => it.description.trim().length > 0 && it.quantity > 0);
    if (validItems.length === 0) {
      setError("Adăugați cel puțin o poziție validă cu descriere și preț.");
      return;
    }

    createInvoiceMutation.mutate({
      studentId,
      groupId: selectedGroupId || undefined,
      type: "situational",
      status: "issued",
      dueDate,
      notes: notes.trim() || undefined,
      items: validItems.map((it) => ({
        description: it.description.trim(),
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Emite factură situativă</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Elev: <strong className="text-slate-800">{studentName}</strong>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangleIcon className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Șabloane rapide ad-hoc:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_CATEGORIES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 rounded-lg border border-slate-200 transition"
                  >
                    + {preset.label} ({preset.price} MDL)
                  </button>
                ))}
              </div>
            </div>

            {/* Group Association & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Grupă / Curs asociat (opțional)
                </label>
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) =>
                    setSelectedGroupId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="">Fără asociere directă</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.courseName ? `(${g.courseName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Data scadenței <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Line Items Editor */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Poziții Factură <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Adaugă poziție</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Descriere poziție..."
                        value={it.description}
                        onChange={(e) => handleItemChange(it.id, "description", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        required
                      />
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        value={it.quantity}
                        onChange={(e) =>
                          handleItemChange(it.id, "quantity", parseInt(e.target.value, 10) || 1)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-center text-slate-800"
                        title="Cantitate"
                        required
                      />
                    </div>

                    <div className="w-28">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          placeholder="Preț"
                          value={it.unitPrice}
                          onChange={(e) =>
                            handleItemChange(
                              it.id,
                              "unitPrice",
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          className="w-full pr-7 pl-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-right font-medium text-slate-800"
                          title="Preț unitar (MDL)"
                          required
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400">
                          MDL
                        </span>
                      </div>
                    </div>

                    <div className="w-24 text-right font-bold text-xs text-slate-900 pr-1 shrink-0 flex items-center justify-end">
                      {it.quantity * it.unitPrice} MDL
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                        title="Șterge poziție"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Total De Plată
                </span>
                <span className="text-base font-extrabold text-blue-700">
                  {totalAmount} MDL
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Note adiționale pe factură
              </label>
              <textarea
                rows={2}
                placeholder="Observații vizibile pentru elev/părinte..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
              />
            </div>
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
              disabled={createInvoiceMutation.isPending || totalAmount <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>
                {createInvoiceMutation.isPending ? "Se generează..." : "Emite Factură"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
