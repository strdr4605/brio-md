"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { XIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/ui/icons";
import { StudentCsvPreviewTable } from "./StudentCsvPreviewTable";
import { parseStudentCsv, type ParsedCandidate } from "@/lib/studentCsvParser";

export type StudentCsvImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function StudentCsvImportModal({ isOpen, onClose, onSuccess }: StudentCsvImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [candidates, setCandidates] = useState<ParsedCandidate[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    duplicates: string[];
    errors: string[];
  } | null>(null);

  const utils = trpc.useUtils();
  const importMutation = trpc.student.bulkImport.useMutation({
    onSuccess: (data) => {
      utils.student.list.invalidate();
      setImportResult(data);
      onSuccess();
    },
    onError: (err) => {
      setParseError(err.message || "A apărut o eroare la importul studenților.");
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setCandidates([]);
      setFileName(null);
      setParseError(null);
      setImportResult(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || "");
        const result = parseStudentCsv(text);
        if (result.error) {
          setParseError(result.error);
        } else {
          setCandidates(result.candidates);
        }
      } catch (err: any) {
        setParseError("Eroare la citirea fișierului CSV: " + err.message);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setParseError("Nu s-a putut citi fișierul selectat.");
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const sample = `Nume,Telefon Elev,Nume Parinte,Telefon Parinte,Varsta\nIon Popescu,069111222,Maria Popescu,079333444,14\nElena Rusu,068555666,Vasile Rusu,068777888,12\nMihai Moraru,,Ana Moraru,069123456,15\n`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "brio_model_import_elevi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = () => {
    const validOnes = candidates.filter((c) => c.isValid);
    if (validOnes.length === 0) {
      setParseError("Nu există elevi valizi de importat.");
      return;
    }

    importMutation.mutate({
      students: validOnes.map((c) => ({
        name: c.name,
        phone: c.phone || null,
        parentName: c.parentName || null,
        parentPhone: c.parentPhone || null,
        age: c.age,
      })),
    });
  };

  const validCount = candidates.filter((c) => c.isValid).length;
  const invalidCount = candidates.length - validCount;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200/80 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xs">
              📊
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Importă Elevi din Excel / CSV
              </h2>
              <p className="text-xs text-slate-500">
                Încarcă lista de elevi pentru transfer rapid
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {importResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
                <CheckCircleIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Import Finalizat cu Succes!</h3>
                <p className="text-xs text-slate-600">
                  Au fost adăugați <span className="font-bold text-emerald-700">{importResult.imported}</span> elevi noi în catalog.
                  {importResult.skipped > 0 && (
                    <span className="block text-slate-500 mt-1">
                      ({importResult.skipped} omise ca duplicate sau incomplete)
                    </span>
                  )}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Vezi Catalogul Actualizat
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dropzone & Sample CTA */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-600">
                  Formate suportate: <span className="font-mono font-semibold">.csv</span> sau export din Excel.
                </span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-xs font-bold text-slate-900 hover:text-slate-700 underline cursor-pointer"
                >
                  Descarcă Model CSV
                </button>
              </div>

              {candidates.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-slate-500 transition cursor-pointer bg-slate-50/50 space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl font-bold">
                    📁
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {isParsing ? "Se analizează fișierul..." : "Apasă aici pentru a alege fișierul CSV"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coloane: Nume, Telefon, Părinte, Telefon Părinte, Vârstă
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{fileName}</span>
                      <span className="text-slate-500 ml-2">
                        ({candidates.length} rânduri • <span className="text-emerald-700 font-semibold">{validCount} valizi</span>
                        {invalidCount > 0 && <span className="text-rose-600 font-semibold">, {invalidCount} cu erori</span>})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCandidates([]);
                        setFileName(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                    >
                      Schimbă fișierul
                    </button>
                  </div>

                  {/* Preview Table */}
                  <StudentCsvPreviewTable candidates={candidates} />
                </div>
              )}

              {parseError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Anulează
                </button>
                {candidates.length > 0 && (
                  <button
                    type="button"
                    disabled={validCount === 0 || importMutation.isPending}
                    onClick={handleConfirmImport}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {importMutation.isPending ? "Se importă..." : `Importă ${validCount} Elevi`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
