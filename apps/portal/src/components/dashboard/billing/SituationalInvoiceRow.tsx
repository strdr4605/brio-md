"use client";

import { XIcon } from "@/components/ui/icons";

export type SituationalLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type SituationalInvoiceRowProps = {
  item: SituationalLineItem;
  onChange: (
    id: string,
    field: "description" | "quantity" | "unitPrice",
    value: string | number,
  ) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
};

export function SituationalInvoiceRow({
  item,
  onChange,
  onRemove,
  canRemove,
}: SituationalInvoiceRowProps) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Descriere poziție..."
          value={item.description}
          onChange={(e) => onChange(item.id, "description", e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800"
          required
        />
      </div>

      <div className="w-20">
        <input
          type="number"
          min="1"
          placeholder="Cant."
          value={item.quantity}
          onChange={(e) =>
            onChange(item.id, "quantity", parseInt(e.target.value, 10) || 1)
          }
          className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-center text-slate-800 font-medium"
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
            value={item.unitPrice}
            onChange={(e) =>
              onChange(
                item.id,
                "unitPrice",
                parseInt(e.target.value, 10) || 0,
              )
            }
            className="w-full pr-7 pl-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-right font-medium text-slate-800"
            title="Preț unitar (MDL)"
            required
          />
          <span className="absolute right-2 top-2 text-[10px] text-slate-400">
            MDL
          </span>
        </div>
      </div>

      <div className="w-24 text-right font-bold text-xs text-slate-900 pr-1 shrink-0 flex items-center justify-end">
        {item.quantity * item.unitPrice} MDL
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
          title="Șterge poziție"
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
