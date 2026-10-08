import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
    const resolved = await context.params;
    const pathSegments = resolved.path || [];

    const uploadsBaseDir = path.resolve(process.cwd(), "uploads");
    const filePath = path.resolve(uploadsBaseDir, ...pathSegments);

    if (!filePath.startsWith(uploadsBaseDir + path.sep)) {
      return new NextResponse("Acces interzis.", { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
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
