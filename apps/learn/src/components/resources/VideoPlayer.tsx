"use client";

import { useMemo } from "react";
import { parseVideoSource } from "@/lib/videoUtils";

type Props = {
  url: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
};

export function VideoPlayer({ url, title = "Video player", className = "", autoPlay = false }: Props) {
  const source = useMemo(() => parseVideoSource(url), [url]);

  if (source.isDirectVideo) {
    return (
      <div className={`w-full flex flex-col items-center justify-center bg-slate-950 rounded-xl overflow-hidden ${className}`}>
        <video
          src={source.embedUrl}
          controls
          autoPlay={autoPlay}
          playsInline
          className="w-full max-h-[75vh] object-contain focus:outline-none"
        >
          Browserul dumneavoastră nu suportă redarea directă a videoclipurilor HTML5.
        </video>
      </div>
    );
  }

  return (
    <div className={`w-full h-full min-h-[300px] flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden relative ${className}`}>
      <iframe
        src={source.embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-none min-h-[360px] max-w-5xl"
      />
    </div>
  );
}
