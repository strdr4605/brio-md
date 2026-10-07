import { NextRequest, NextResponse } from "next/server";
import { auth } from "@brio-md/auth";
import { uploadFileToStorage } from "@/lib/storage";

// 50 MB max file size limit
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
  // Documents
  "application/pdf",
  "application/msword",
  "application/x-msword",
  "application/vnd.ms-word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  // Videos
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".mp4",
  ".webm",
  ".mov",
  ".ogg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Autentificare necesară pentru a încărca fișiere." },
        { status: 401 },
      );
    }

    const role = (session.user as { role?: string }).role || "teacher";
    const permissions = (session.user as { permissions?: string[] }).permissions || [];
    const isTeacher =
      role === "teacher" ||
      role === "admin" ||
      role === "superadmin" ||
      permissions.includes("teach") ||
      permissions.includes("admin") ||
      permissions.includes("super");

    if (!isTeacher) {
      return NextResponse.json(
        { error: "Doar profesorii și administratorii pot încărca resurse didactice." },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Niciun fișier valid nu a fost trimis." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Fișierul depășește limita maximă admisă de 50 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).` },
        { status: 413 },
      );
    }

    const filename = (file instanceof File ? file.name : "upload.bin") || "upload.bin";
    const ext = "." + (filename.split(".").pop() || "").toLowerCase();
    const isMimeAllowed = file.type ? ALLOWED_MIME_TYPES.has(file.type) : false;
    const isExtAllowed = ALLOWED_EXTENSIONS.has(ext);

    if (!isMimeAllowed && !isExtAllowed) {
      return NextResponse.json(
        { error: `Formatul fișierului (${filename}) nu este suportat. Vă rugăm să încărcați documente (PDF, Word, Excel) sau fișiere video (MP4/WebM).` },
        { status: 400 },
      );
    }

    const contentType = file.type || "application/octet-stream";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFileToStorage({
      buffer,
      filename,
      contentType,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      size: result.size,
      contentType: result.contentType,
      originalName: filename,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Eroare internă la încărcarea fișierului.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
