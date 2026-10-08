"use client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isPending?: boolean;
};

export function ConfirmDetachModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isPending,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-150">
        {/* Warning Icon Container (Semantic Rose) */}
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold border border-rose-100">
          🗑️
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          Detașează Resursa
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Sigur doriți să detașați <strong className="text-slate-800">«{title}»</strong> din această sesiune?
          Resursa va rămâne salvată în biblioteca de resurse.
        </p>

        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            {isPending ? "Se detașează..." : "Detașează"}
          </button>
        </div>
      </div>
    </div>
  );
}
