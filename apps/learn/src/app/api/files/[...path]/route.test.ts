import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@brio-md/auth", () => ({
  auth: vi.fn(),
}));

import { db } from "@/lib/db";
import { auth } from "@brio-md/auth";

const mockSession = (user: Record<string, unknown> | null) =>
  vi.mocked(auth as unknown as () => Promise<unknown>).mockResolvedValue(user ? { user } : null);

describe("GET /api/files/[...path] in Learn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession({ role: "student", permissions: [], schoolId: 1 });
  });

  it("returns 401 when there is no session", async () => {
    mockSession(null);
    const req = new NextRequest("http://localhost:3003/api/files/10");
    const res = await GET(req, { params: Promise.resolve({ path: ["10"] }) });

    expect(res.status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("returns 403 when the stored file belongs to another school", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 11,
              schoolId: 2,
              filename: "private.pdf",
              mimeType: "application/pdf",
              sizeBytes: 3,
              dataBase64: Buffer.from("abc").toString("base64"),
              createdAt: new Date(),
            },
          ]),
        }),
      }),
    } as any);

    const req = new NextRequest("http://localhost:3003/api/files/11");
    const res = await GET(req, { params: Promise.resolve({ path: ["11"] }) });

    expect(res.status).toBe(403);
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
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=3600");

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
