"use client";

type Props = {
  url: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  className?: string;
};

function formatFileSize(bytes?: unknown): string | null {
  if (typeof bytes !== "number" || bytes <= 0) return null;
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getDocumentFormatInfo(url: string, metadata?: Record<string, unknown> | null) {
  const originalName = typeof metadata?.originalName === "string" ? metadata.originalName : "";
  const target = `${url} ${originalName}`.toLowerCase();

  if (target.includes(".docx") || target.includes(".doc")) {
    return {
      typeLabel: "Microsoft Word",
      extension: ".docx",
      icon: "📄",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description:
        "Document de lucru Word editabil. Salvează fișierul pe calculator pentru a-l completa, edita sau imprima în Microsoft Word, Google Docs sau LibreOffice.",
    };
  }

  if (target.includes(".xlsx") || target.includes(".xls")) {
    return {
      typeLabel: "Microsoft Excel",
      extension: ".xlsx",
      icon: "📊",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description:
        "Tabel de calcul editabil. Salvează fișierul pe calculator pentru a-l deschide în Microsoft Excel, Google Sheets sau LibreOffice Calc.",
    };
  }

  if (target.includes(".pptx") || target.includes(".ppt")) {
    return {
      typeLabel: "Microsoft PowerPoint",
      extension: ".pptx",
      icon: "📽️",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      description:
        "Prezentare didactică. Salvează fișierul pe calculator pentru a rula diapozitivele în Microsoft PowerPoint sau Google Slides.",
    };
  }

  return {
    typeLabel: "Document Descărcabil",
    extension: "Fișier",
    icon: "📁",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    description:
      "Fișier didactic disponibil pentru lucru local. Salvează fișierul pe calculator pentru a-l deschide cu aplicația dedicată.",
  };
}

export function DocumentDownloadCard({ url, title, description, metadata, className = "" }: Props) {
  const formatInfo = getDocumentFormatInfo(url, metadata);
  const originalName =
    typeof metadata?.originalName === "string"
      ? metadata.originalName
      : url.split("/").pop() || `${title}${formatInfo.extension}`;
  const fileSizeText = formatFileSize(metadata?.fileSize);

  const canUseOfficeOnline = url.startsWith("http") && !url.includes("localhost") && !url.includes("127.0.0.1");

  return (
    <div className={`w-full h-full flex items-center justify-center p-4 sm:p-6 bg-slate-50/70 overflow-auto ${className}`}>
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm max-w-lg w-full text-center space-y-6">
        {/* Document Icon and Format Badge */}
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-3xl mx-auto border border-slate-200/70 shadow-2xs">
            {formatInfo.icon}
          </div>

          <div className="flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${formatInfo.badgeColor}`}
            >
              {formatInfo.typeLabel}
            </span>
            {fileSizeText && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                {fileSizeText}
              </span>
            )}
          </div>
        </div>

        {/* Title and Explanation */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug" title={title}>
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            {description || formatInfo.description}
          </p>
        </div>

        {/* File Details Strip */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between gap-3 text-left">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nume Fișier</p>
            <p className="font-mono text-xs text-slate-800 truncate" title={originalName}>
              {originalName}
            </p>
          </div>
          {fileSizeText && (
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dimensiune</p>
              <p className="font-semibold text-slate-700">{fileSizeText}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 pt-2">
          <a
            href={url}
            download={originalName}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Salvează pe Calculator</span>
          </a>

          {canUseOfficeOnline && (
            <a
              href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200/80 transition cursor-pointer"
            >
              <span>Office Online</span>
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
