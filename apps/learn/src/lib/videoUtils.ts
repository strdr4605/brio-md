export type VideoSource = {
  provider: "youtube" | "vimeo" | "drive" | "direct" | "generic";
  embedUrl: string;
  isDirectVideo: boolean;
};

/**
 * Parses and normalizes various video URLs (YouTube, Vimeo, Google Drive, direct MP4/WebM files)
 * into a standard format ready for playback.
 */
export function parseVideoSource(rawUrl: string): VideoSource {
  const url = (rawUrl || "").trim();
  const lower = url.toLowerCase();

  // 1. Direct video files (MP4, WebM, Ogg, QuickTime)
  const isDirect =
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".mov") ||
    lower.includes(".mp4?") ||
    lower.includes(".webm?");

  if (isDirect) {
    return {
      provider: "direct",
      embedUrl: url,
      isDirectVideo: true,
    };
  }

  // 2. YouTube (standard watch, short URL, shorts, embed)
  if (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("youtube-nocookie.com")
  ) {
    try {
      if (lower.includes("youtube.com/watch")) {
        const parsed = new URL(url);
        const v = parsed.searchParams.get("v");
        if (v) {
          return {
            provider: "youtube",
            embedUrl: `https://www.youtube.com/embed/${v}`,
            isDirectVideo: false,
          };
        }
      } else if (lower.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0]?.split("/")[0];
        if (id) {
          return {
            provider: "youtube",
            embedUrl: `https://www.youtube.com/embed/${id}`,
            isDirectVideo: false,
          };
        }
      } else if (lower.includes("youtube.com/shorts/")) {
        const id = url.split("youtube.com/shorts/")[1]?.split("?")[0]?.split("/")[0];
        if (id) {
          return {
            provider: "youtube",
            embedUrl: `https://www.youtube.com/embed/${id}`,
            isDirectVideo: false,
          };
        }
      } else if (
        lower.includes("youtube.com/embed/") ||
        lower.includes("youtube-nocookie.com/embed/")
      ) {
        return {
          provider: "youtube",
          embedUrl: url,
          isDirectVideo: false,
        };
      }
    } catch {
      // Fallback below
    }
    return {
      provider: "youtube",
      embedUrl: url,
      isDirectVideo: false,
    };
  }

  // 3. Google Drive video/file preview
  if (lower.includes("drive.google.com/file/d/")) {
    const parts = url.split("drive.google.com/file/d/")[1]?.split("/");
    const id = parts?.[0];
    if (id) {
      return {
        provider: "drive",
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        isDirectVideo: false,
      };
    }
  }

  // 4. Vimeo
  if (lower.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1]?.split("?")[0]?.split("/")[0];
    if (id && /^\d+$/.test(id)) {
      return {
        provider: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${id}`,
        isDirectVideo: false,
      };
    }
  }

  return {
    provider: "generic",
    embedUrl: url,
    isDirectVideo: false,
  };
}
