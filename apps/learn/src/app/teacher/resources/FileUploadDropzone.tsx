"use client";

import { useState, useRef } from "react";

export type UploadSuccessData = {
  url: string;
  filename: string;
  size: number;
  contentType: string;
  detectedType: "pdf" | "video" | "worksheet" | "manual";
};

type Props = {
  onUploadSuccess: (data: UploadSuccessData) => void;
  currentFilename?: string;
};

export function FileUploadDropzone({ onUploadSuccess, currentFilename }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(currentFilename || null);
  const [uploadedSize, setUploadedSize] = useState<number | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectResourceType = (
    filename: string,
    mimeType: string,
  ): "pdf" | "video" | "worksheet" | "manual" => {
    const lower = filename.toLowerCase();
    if (mimeType.startsWith("video/") || lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov")) {
      return "video";
    }
    if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
      return "pdf";
    }
    if (lower.includes("manual") || lower.includes("carte") || lower.includes("ghid")) {
      return "manual";
    }
    return "worksheet";
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadError(`Fișierul depășește limita de 50 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Eroare la încărcare.");
      }

      setUploadedName(file.name);
      setUploadedSize(file.size);

      const detected = detectResourceType(file.name, file.type);
      setDetectedType(detected);
      onUploadSuccess({
        url: data.url,
        filename: file.name,
        size: data.size,
        contentType: data.contentType,
        detectedType: detected,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Nu s-a putut încărca fișierul.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.mp4,.webm,.mov,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`p-5 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center text-center cursor-pointer ${
          isDragging
            ? "border-slate-500 bg-slate-100"
            : uploadedName
              ? "border-emerald-300 bg-emerald-50/30"
              : "border-slate-200/90 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300"
        }`}
      >
        {isUploading ? (
          <div className="space-y-2 py-2">
            <div className="w-8 h-8 mx-auto border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-700">Se încarcă fișierul...</p>
          </div>
        ) : uploadedName ? (
          <div className="space-y-1.5 py-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate max-w-sm">{uploadedName}</p>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              {uploadedSize && <span>{(uploadedSize / (1024 * 1024)).toFixed(2)} MB</span>}
              {detectedType && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 text-[10px]">
                  {detectedType === "video" ? "Lecție Video" : detectedType === "pdf" ? "Document PDF" : "Fișă de Lucru"}
                </span>
              )}
            </div>
            <span className="inline-block text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline mt-1">
              Schimbă fișierul
            </span>
          </div>
        ) : (
          <div className="space-y-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Trage fișierul aici sau <span className="underline text-slate-900 font-bold">alege din dispozitiv</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PDF, Word, Video (max 50 MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          {uploadError}
        </div>
      )}
    </div>
  );
}
