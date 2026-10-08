import { useState } from "react";
import { normalizeGameUrl } from "@/lib/gameUrlHelper";

export type ResourceType =
  | "pdf"
  | "manual"
  | "textbook"
  | "worksheet"
  | "minigame"
  | "link"
  | "video"
  | "vdr";

export function useResourceForm() {
  const [inputMode, setInputMode] = useState<"upload" | "link">("upload");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("worksheet");
  const [url, setUrl] = useState("");
  const [uploadedMeta, setUploadedMeta] = useState<{
    size?: number;
    mimeType?: string;
    originalName?: string;
  } | null>(null);
  const [instructions, setInstructions] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [maxScore, setMaxScore] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [sessionNumber, setSessionNumber] = useState<string>("");
  const [orderIndex, setOrderIndex] = useState<number>(10);
  const [showDetails, setShowDetails] = useState(false);

  const resetForm = () => {
    setInputMode("upload");
    setTitle("");
    setDescription("");
    setType("worksheet");
    setUrl("");
    setUploadedMeta(null);
    setInstructions("");
    setGuidelines("");
    setMaxScore("");
    setLevel("");
    setCourseId("");
    setSessionNumber("");
    setOrderIndex(10);
    setShowDetails(false);
  };

  const handleUrlChange = (val: string) => {
    setUrl(val);
    const lower = val.toLowerCase();
    if (
      lower.includes("youtube.com") ||
      lower.includes("youtu.be") ||
      lower.includes("vimeo.com")
    ) {
      setType("video");
    } else if (
      lower.includes("scratch.mit.edu") ||
      lower.includes("wordwall.net") ||
      lower.includes("phet.colorado.edu") ||
      lower.includes("geogebra.org")
    ) {
      setType("minigame");
    }
  };

  const applyPreset = (preset: {
    title: string;
    url: string;
    maxScore: number;
    instructions: string;
  }) => {
    setTitle(preset.title);
    setUrl(preset.url);
    setMaxScore(String(preset.maxScore));
    setInstructions(preset.instructions);
    if (preset.instructions) setShowDetails(true);
  };

  const getPayload = () => {
    const normalized = type === "minigame" ? normalizeGameUrl(url.trim()) : null;
    return {
      title: title.trim(),
      description: description.trim() || null,
      type,
      url: normalized?.url || url.trim(),
      courseId: courseId ? parseInt(courseId, 10) : undefined,
      sessionNumber: sessionNumber ? parseInt(sessionNumber, 10) : undefined,
      orderIndex: courseId ? orderIndex : undefined,
      metadata: {
        embedUrl: normalized?.embedUrl,
        provider: normalized?.provider,
        instructions: instructions.trim() || undefined,
        guidelines: guidelines.trim() || undefined,
        level: level.trim() || undefined,
        maxScore: maxScore ? parseInt(maxScore, 10) : undefined,
        fileSize: uploadedMeta?.size,
        mimeType: uploadedMeta?.mimeType,
        originalName: uploadedMeta?.originalName,
      },
    };
  };

  return {
    inputMode,
    setInputMode,
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    url,
    setUrl,
    uploadedMeta,
    setUploadedMeta,
    instructions,
    setInstructions,
    guidelines,
    setGuidelines,
    maxScore,
    setMaxScore,
    level,
    setLevel,
    courseId,
    setCourseId,
    sessionNumber,
    setSessionNumber,
    orderIndex,
    setOrderIndex,
    showDetails,
    setShowDetails,
    resetForm,
    handleUrlChange,
    applyPreset,
    getPayload,
  };
}
