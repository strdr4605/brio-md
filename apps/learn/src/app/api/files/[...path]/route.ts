import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { auth } from "@brio-md/auth";
import { db } from "@/lib/db";
import { storedFiles } from "@brio-md/db";

type FileSessionUser = {
  role?: string | null;
  permissions?: string[] | null;
  schoolId?: number | null;
  expired?: boolean;
};

type StoredFile = typeof storedFiles.$inferSelect;

function storedFileResponse(user: FileSessionUser, stored: StoredFile) {
  const isSuper = user.role === "superadmin" || (user.permissions ?? []).includes("super");
  if (!isSuper && stored.schoolId !== null && stored.schoolId !== user.schoolId) {
    return new NextResponse("Acces interzis.", { status: 403 });
  }

  const buffer = Buffer.from(stored.dataBase64, "base64");
  const headers: Record<string, string> = {
    "Content-Type": stored.mimeType || "application/octet-stream",
    "Content-Disposition": `inline; filename="${encodeURIComponent(stored.filename)}"`,
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Content-Length": String(buffer.length),
  };
  if (stored.mimeType === "image/svg+xml") {
    headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'";
  }
  return new Response(buffer, { status: 200, headers });
}

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mov": "video/quicktime",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const session = await auth().catch(() => null);
    const user = session?.user as FileSessionUser | undefined;
    if (!user || user.expired) {
      return new NextResponse("Autentificare necesară.", { status: 401 });
    }

    const resolved = await context.params;
    const pathSegments = resolved.path || [];

    // 1. If requesting by numeric ID (e.g. /api/files/1), fetch from Neon stored_files
    if (pathSegments.length === 1 && /^\d+$/.test(pathSegments[0])) {
      const fileId = parseInt(pathSegments[0], 10);
      const [stored] = await db
        .select()
        .from(storedFiles)
        .where(eq(storedFiles.id, fileId))
        .limit(1);

      if (stored) {
        return storedFileResponse(user, stored);
      }
      return new NextResponse("Fișierul nu a fost găsit.", { status: 404 });
    }

    const uploadsBaseDir = path.resolve(process.cwd(), "uploads");
    const filePath = path.resolve(uploadsBaseDir, ...pathSegments);

    if (!filePath.startsWith(uploadsBaseDir + path.sep)) {
      return new NextResponse("Acces interzis.", { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      // Fallback: check stored_files in DB by filename
      const filename = pathSegments[pathSegments.length - 1];
      const [stored] = await db
        .select()
        .from(storedFiles)
        .where(eq(storedFiles.filename, filename))
        .limit(1);

      if (stored) {
        return storedFileResponse(user, stored);
      }

      return new NextResponse("Fișierul nu a fost găsit.", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return new NextResponse("Cale invalidă.", { status: 400 });
    }

    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const isSvg = ext === ".svg" || contentType === "image/svg+xml";

    const range = req.headers.get("range");

    // Handle HTTP 206 Range requests for smooth video seeking & streaming
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse("Requested range not satisfiable", {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      const responseHeaders: Record<string, string> = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunksize),
        "Content-Type": contentType,
      };

      if (isSvg) {
        responseHeaders["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'";
      }

      return new NextResponse(webStream, {
        status: 206,
        headers: responseHeaders,
      });
    }

    const fileStream = fs.createReadStream(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    const responseHeaders: Record<string, string> = {
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    };

    if (isSvg) {
      responseHeaders["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'";
    }

    return new NextResponse(webStream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Eroare la servirea fișierului.";
    return new NextResponse(message, { status: 500 });
  }
}
