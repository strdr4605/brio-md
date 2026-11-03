import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storedFiles } from "@brio-md/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const fileId = parseInt(id, 10);

    if (isNaN(fileId) || fileId <= 0) {
      return new NextResponse("ID invalid de fișier.", { status: 400 });
    }

    const [file] = await db
      .select()
      .from(storedFiles)
      .where(eq(storedFiles.id, fileId))
      .limit(1);

    if (!file) {
      return new NextResponse("Fișierul nu a fost găsit.", { status: 404 });
    }

    const buffer = Buffer.from(file.dataBase64, "base64");

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
        "Cache-Control": "public, max-age=86400",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Eroare internă la procesarea fișierului.";
    return new NextResponse(message, { status: 500 });
  }
}
