import { z } from "zod";

export const resourceTypeSchema = z.enum([
  "pdf",
  "manual",
  "textbook",
  "worksheet",
  "minigame",
  "link",
  "video",
  "vdr",
]);

export const resourceMetadataSchema = z
  .object({
    maxScore: z.number().optional(),
    level: z.string().optional(),
    guidelines: z.string().optional(),
    instructions: z.string().optional(),
    embedUrl: z.string().optional(),
    provider: z.string().optional(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    originalName: z.string().optional(),
  })
  .catchall(z.unknown())
  .nullable()
  .optional();

export const createResourceInputSchema = z.object({
  title: z.string().min(1, "Titlul resursei este obligatoriu"),
  description: z.string().nullable().optional(),
  type: resourceTypeSchema,
  url: z.string().min(1, "URL-ul este obligatoriu"),
  schoolId: z.number().nullable().optional(),
  metadata: resourceMetadataSchema,
  courseId: z.number().optional(),
  sessionNumber: z.number().optional(),
  orderIndex: z.number().optional().default(10),
});

export const updateResourceInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Titlul resursei este obligatoriu"),
  description: z.string().nullable().optional(),
  type: resourceTypeSchema,
  url: z.string().min(1, "URL-ul este obligatoriu"),
  metadata: resourceMetadataSchema,
  courseId: z.number().nullable().optional(),
  sessionNumber: z.number().nullable().optional(),
  orderIndex: z.number().optional().default(10),
});

export const getLibraryResourcesInputSchema = z
  .object({
    search: z.string().optional(),
    type: z
      .enum([
        "all",
        "pdf",
        "manual",
        "textbook",
        "worksheet",
        "minigame",
        "link",
        "video",
        "vdr",
      ])
      .optional(),
    schoolId: z.number().optional(),
  })
  .optional();
