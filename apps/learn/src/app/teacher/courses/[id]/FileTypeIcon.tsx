"use client";

import {
  FileTextIcon,
  GamepadIcon,
  VideoIcon,
  ExternalLinkIcon,
  BookOpenIcon,
} from "@brio-md/ui";

type FileTypeIconProps = {
  type: string;
  className?: string;
};

export function FileTypeIcon({ type, className = "w-5 h-5" }: FileTypeIconProps) {
  switch (type.toLowerCase()) {
    case "pdf":
      return (
        <div className="relative inline-flex items-center justify-center shrink-0">
          <FileTextIcon className={`${className} text-rose-500`} />
          <span className="absolute -bottom-1 -right-1 text-[8px] font-black uppercase tracking-tighter bg-rose-600 text-white px-1 py-0.2 rounded-xs shadow-2xs leading-tight">
            PDF
          </span>
        </div>
      );

    case "presentation":
    case "pptx":
    case "ppt":
      return (
        <div className="relative inline-flex items-center justify-center shrink-0">
          <FileTextIcon className={`${className} text-amber-600`} />
          <span className="absolute -bottom-1 -right-1 text-[8px] font-black uppercase tracking-tighter bg-amber-600 text-white px-1 py-0.2 rounded-xs shadow-2xs leading-tight">
            PPT
          </span>
        </div>
      );

    case "worksheet":
      return <FileTextIcon className={`${className} text-teal-600`} />;

    case "minigame":
      return <GamepadIcon className={`${className} text-indigo-600`} />;

    case "video":
      return <VideoIcon className={`${className} text-rose-600`} />;

    case "link":
      return <ExternalLinkIcon className={`${className} text-cyan-600`} />;

    case "textbook":
    case "manual":
      return <BookOpenIcon className={`${className} text-amber-600`} />;

    default:
      return <FileTextIcon className={`${className} text-slate-500`} />;
  }
}
