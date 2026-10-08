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

export const courseResourceSettingsSchema = z
  .object({
    maxScore: z.number().optional(),
    targetMinigamesCount: z.number().optional(),
    instructions: z.string().optional(),
  })
  .catchall(z.unknown())
  .nullable()
  .optional();

export const assignResourceToSessionInputSchema = z.object({
  courseId: z.number(),
  resourceId: z.number(),
  sessionNumber: z.number().nullable().optional(),
  orderIndex: z.number().optional().default(0),
  settings: courseResourceSettingsSchema,
});

export const updateCourseResourceSettingsInputSchema = z.object({
  id: z.number(),
  sessionNumber: z.number().nullable().optional(),
  orderIndex: z.number().optional(),
  settings: courseResourceSettingsSchema,
});

export const detachResourceFromSessionInputSchema = z.object({
  id: z.number().optional(),
  courseId: z.number().optional(),
  resourceId: z.number().optional(),
  sessionNumber: z.number().nullable().optional(),
});

export const reorderSessionResourcesInputSchema = z.object({
  courseId: z.number(),
  sessionNumber: z.number().nullable().optional(),
  items: z.array(
    z.object({
      id: z.number(),
      orderIndex: z.number(),
    }),
  ),
});
