import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@brio-md/auth";
import { db } from "@/db";
import { storedFiles } from "@brio-md/db";

type FileSessionUser = {
  role?: string | null;
  permissions?: string[] | null;
  schoolId?: number | null;
  expired?: boolean;
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth().catch(() => null);
    const user = session?.user as FileSessionUser | undefined;
    if (!user || user.expired) {
      return new NextResponse("Autentificare necesară.", { status: 401 });
    }

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

    const isSuper = user.role === "superadmin" || (user.permissions ?? []).includes("super");
    if (!isSuper && file.schoolId !== null && file.schoolId !== user.schoolId) {
      return new NextResponse("Acces interzis.", { status: 403 });
    }

    const buffer = Buffer.from(file.dataBase64, "base64");
    const headers: Record<string, string> = {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Length": String(buffer.length),
    };
    if (file.mimeType === "image/svg+xml") {
      headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'";
    }

    return new Response(buffer, { status: 200, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Eroare internă la procesarea fișierului.";
    return new NextResponse(message, { status: 500 });
  }
}
