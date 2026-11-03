import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("GET /api/files/[...path] in Learn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when numeric id is requested but not in stored_files", async () => {
    const mockWhere = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
    });
    const mockFrom = vi.fn().mockReturnValue({
      where: mockWhere,
    });
    vi.mocked(db.select).mockReturnValue({
      from: mockFrom,
    } as any);

    const req = new NextRequest("http://localhost:3003/api/files/999");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["999"] }),
    });

    expect(res.status).toBe(404);
  });

  it("streams PDF document correctly from Neon stored_files when requested by id", async () => {
    const samplePdfRaw = "%PDF-1.4 test robotics guide";
    const base64Content = Buffer.from(samplePdfRaw).toString("base64");

    const mockFileRecord = {
      id: 10,
      schoolId: 1,
      filename: "robotics-guide.pdf",
      mimeType: "application/pdf",
      sizeBytes: Buffer.byteLength(samplePdfRaw),
      dataBase64: base64Content,
      createdAt: new Date(),
    };

    const mockWhere = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([mockFileRecord]),
    });
    const mockFrom = vi.fn().mockReturnValue({
      where: mockWhere,
    });
    vi.mocked(db.select).mockReturnValue({
      from: mockFrom,
    } as any);

    const req = new NextRequest("http://localhost:3003/api/files/10");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["10"] }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain('inline; filename="robotics-guide.pdf"');
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");

    const arrayBuffer = await res.arrayBuffer();
    expect(Buffer.from(arrayBuffer).toString()).toBe(samplePdfRaw);
  });

  it("blocks directory traversal paths", async () => {
    const req = new NextRequest("http://localhost:3003/api/files/../../etc/passwd");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["..", "..", "etc", "passwd"] }),
    });

    expect(res.status).toBe(403);
  });
});
