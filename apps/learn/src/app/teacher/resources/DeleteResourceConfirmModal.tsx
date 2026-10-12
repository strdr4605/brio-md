"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export type DeletableResource = {
  id: number;
  title: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  resource: DeletableResource | null;
  onDeleted?: (deletedId: number) => void;
};

export function DeleteResourceConfirmModal({
  isOpen,
  onClose,
  resource,
  onDeleted,
}: Props) {
  const utils = trpc.useUtils();

  const deleteMutation = trpc.resource.deleteLearningResource.useMutation({
    onSuccess: (res) => {
      utils.resource.getLibraryResources.invalidate();
      utils.resource.getResourceAssignments.invalidate();
      utils.resource.getCourseResources.invalidate();
      onDeleted?.(res.id);
      onClose();
    },
    onError: (err) => {
      alert(err.message || "A apărut o eroare la ștergerea resursei.");
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteMutation.isPending) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, onClose, deleteMutation.isPending]);

  if (!isOpen || !resource) return null;

  const handleConfirm = () => {
    deleteMutation.mutate({ id: resource.id });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleteMutation.isPending) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              Șterge resursa didactică
            </h3>
            <p className="text-xs font-semibold text-slate-700 truncate" title={resource.title}>
              &ldquo;{resource.title}&rdquo;
            </p>
          </div>
        </div>

        <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3.5 space-y-1">
          <p className="text-xs text-rose-900 font-medium leading-relaxed">
            This resource will be detached from all course sessions. Are you sure you want to proceed?
          </p>
          <p className="text-[11px] text-rose-700 leading-normal">
            Această resursă va fi detașată din toate sesiunile de curs și ștearsă definitiv.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {deleteMutation.isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Se șterge...</span>
              </>
            ) : (
              <span>Șterge definitiv</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
