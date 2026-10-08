export type AttachedResource = {
  id: number;
  courseId: number;
  resourceId: number;
  sessionNumber: number | null;
  orderIndex: number | null;
  settings: {
    maxScore?: number;
    targetMinigamesCount?: number;
    instructions?: string;
    dueDate?: string;
    [key: string]: unknown;
  } | null;
  createdAt: Date | null;
  resource: {
    id: number;
    title: string;
    description: string | null;
    type: "pdf" | "manual" | "textbook" | "worksheet" | "minigame" | "link" | "video" | "vdr";
    url: string;
    metadata: unknown;
    schoolId: number | null;
  };
};

export type LibraryResourceItem = {
  id: number;
  title: string;
  description: string | null;
  type: "pdf" | "manual" | "textbook" | "worksheet" | "minigame" | "link" | "video" | "vdr";
  url: string;
  metadata: {
    maxScore?: number;
    instructions?: string;
    [key: string]: unknown;
  } | null;
  schoolId: number | null;
};
