"use client";

import { useEffect } from "react";
import { normalizeGameUrl } from "@/lib/gameUrlHelper";
import { VideoPlayer } from "@/components/resources/VideoPlayer";
import { parseVideoSource } from "@/lib/videoUtils";
import { DocumentDownloadCard } from "@/components/resources/DocumentDownloadCard";

type ResourcePreviewItem = {
  id: number;
  title: string;
  type: string;
  url: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourcePreviewItem | null;
};

export function ResourcePreviewModal({ isOpen, onClose, resource }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen || !resource) return null;

  const url = resource.url.trim();
  const isOfficeDocument =
    url.toLowerCase().endsWith(".docx") ||
    url.toLowerCase().endsWith(".doc") ||
    url.toLowerCase().endsWith(".xlsx") ||
    url.toLowerCase().endsWith(".xls") ||
    url.toLowerCase().endsWith(".pptx") ||
    url.toLowerCase().endsWith(".ppt") ||
    (resource.metadata?.mimeType as string)?.includes("wordprocessingml") ||
    (resource.metadata?.mimeType as string)?.includes("msword") ||
    (resource.metadata?.mimeType as string)?.includes("spreadsheetml") ||
    (resource.metadata?.mimeType as string)?.includes("presentationml") ||
    (typeof resource.metadata?.originalName === "string" &&
      /\.(docx?|xlsx?|pptx?)$/i.test(resource.metadata.originalName));

  const isPdf =
    !isOfficeDocument &&
    (resource.type === "pdf" ||
      resource.type === "manual" ||
      resource.type === "textbook" ||
      url.toLowerCase().endsWith(".pdf"));

  const videoSource = parseVideoSource(url);
  const isVideo =
    resource.type === "video" ||
    videoSource.provider !== "generic" ||
    videoSource.isDirectVideo;

  const isMinigame = resource.type === "minigame";
  const metaEmbedUrl =
    typeof resource.metadata?.embedUrl === "string"
      ? resource.metadata.embedUrl
      : null;

  const instructions =
    typeof resource.metadata?.instructions === "string"
      ? resource.metadata.instructions
      : null;
  const guidelines =
    typeof resource.metadata?.guidelines === "string"
      ? resource.metadata.guidelines
      : null;

  const getEmbedUrl = (rawUrl: string): string => {
    if (metaEmbedUrl) return metaEmbedUrl;
    if (isMinigame) {
      return normalizeGameUrl(rawUrl).embedUrl;
    }
    try {
      if (rawUrl.includes("youtube.com/watch")) {
        const urlObj = new URL(rawUrl);
        const videoId = urlObj.searchParams.get("v");
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      } else if (rawUrl.includes("youtu.be/")) {
        const id = rawUrl.split("youtu.be/")[1]?.split("?")[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
    } catch {
      // Fallback to rawUrl
    }
    return rawUrl;
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-6xl h-[92vh] sm:h-[94vh] flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200 uppercase tracking-wider shrink-0">
                {resource.type}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate" title={resource.title}>
                {resource.title}
              </h3>
            </div>

            {(resource.description || instructions || guidelines) && (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-xs text-slate-500 min-w-0">
                {resource.description && (
                  <span
                    className="text-slate-600 truncate max-w-md xl:max-w-xl"
                    title={resource.description}
                  >
                    {resource.description}
                  </span>
                )}
                {resource.description && (instructions || guidelines) && (
                  <span className="text-slate-300 select-none">•</span>
                )}
                {instructions && (
                  <span className="truncate max-w-xs text-slate-500" title={`Instrucțiuni: ${instructions}`}>
                    <strong className="font-semibold text-slate-700">Instrucțiuni: </strong>
                    {instructions}
                  </span>
                )}
                {instructions && guidelines && (
                  <span className="text-slate-300 select-none">•</span>
                )}
                {guidelines && (
                  <span className="truncate max-w-xs text-slate-500" title={`Ghid: ${guidelines}`}>
                    <strong className="font-semibold text-slate-700">Ghid: </strong>
                    {guidelines}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition flex items-center gap-1.5"
            >
              <span>Deschide în tab nou</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              aria-label="Închide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
          {isOfficeDocument ? (
            <DocumentDownloadCard
              url={url}
              title={resource.title}
              description={resource.description}
              metadata={resource.metadata}
              className="w-full h-full"
            />
          ) : isPdf ? (
            <iframe
              src={embedUrl}
              title={resource.title}
              className="w-full h-full border-none"
            />
          ) : isVideo ? (
            <VideoPlayer
              url={url}
              title={resource.title}
              className="w-full h-full p-2 sm:p-4"
            />
          ) : isMinigame ? (
            <iframe
              src={embedUrl}
              title={resource.title}
              allow="fullscreen; autoplay"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="w-full h-full border-none bg-white"
            />
          ) : (
            <iframe
              src={embedUrl}
              title={resource.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="w-full h-full border-none bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
