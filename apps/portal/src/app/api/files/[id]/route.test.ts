import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@brio-md/auth", () => ({
  auth: vi.fn(),
}));

import { db } from "@/db";
import { auth } from "@brio-md/auth";

const mockSession = (user: Record<string, unknown> | null) =>
  vi.mocked(auth as unknown as () => Promise<unknown>).mockResolvedValue(user ? { user } : null);

const mockFileLookup = (rows: unknown[]) => {
  vi.mocked(db.select).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(rows) }),
    }),
  } as any);
};

const foreignFile = {
  id: 50,
  schoolId: 2,
  filename: "private.pdf",
  mimeType: "application/pdf",
  sizeBytes: 3,
  dataBase64: Buffer.from("abc").toString("base64"),
  createdAt: new Date(),
};

describe("GET /api/files/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession({ role: "teacher", permissions: ["teach"], schoolId: 1 });
  });

  it("returns 401 when there is no session", async () => {
    mockSession(null);
    const req = new NextRequest("http://localhost:3002/api/files/42");
    const res = await GET(req, { params: Promise.resolve({ id: "42" }) });

    expect(res.status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("returns 403 when the file belongs to another school", async () => {
    mockFileLookup([foreignFile]);
    const req = new NextRequest("http://localhost:3002/api/files/50");
    const res = await GET(req, { params: Promise.resolve({ id: "50" }) });

    expect(res.status).toBe(403);
  });

  it("lets a superadmin download files from any school", async () => {
    mockSession({ role: "superadmin", permissions: ["super"], schoolId: null });
    mockFileLookup([foreignFile]);
    const req = new NextRequest("http://localhost:3002/api/files/50");
    const res = await GET(req, { params: Promise.resolve({ id: "50" }) });

    expect(res.status).toBe(200);
  });

  it("returns 400 when file id is not a valid positive integer", async () => {
    const req = new NextRequest("http://localhost:3002/api/files/invalid");
    const res = await GET(req, {
      params: Promise.resolve({ id: "invalid" }),
    });

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("ID invalid");
  });

  it("returns 404 when file is not found in database", async () => {
    const mockWhere = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
    });
    const mockFrom = vi.fn().mockReturnValue({
      where: mockWhere,
    });
    vi.mocked(db.select).mockReturnValue({
      from: mockFrom,
    } as any);

    const req = new NextRequest("http://localhost:3002/api/files/999");
    const res = await GET(req, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toContain("nu a fost găsit");
  });

  it("streams PDF document correctly with 200 OK and proper headers", async () => {
    const samplePdfRaw = "%PDF-1.4 sample content";
    const base64Content = Buffer.from(samplePdfRaw).toString("base64");

    const mockFileRecord = {
      id: 42,
      schoolId: 1,
      filename: "sample-guide.pdf",
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

    const req = new NextRequest("http://localhost:3002/api/files/42");
    const res = await GET(req, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain('inline; filename="sample-guide.pdf"');
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=3600");
    expect(res.headers.get("Content-Length")).toBe(String(mockFileRecord.sizeBytes));

    const arrayBuffer = await res.arrayBuffer();
    const resultBuffer = Buffer.from(arrayBuffer);
    expect(resultBuffer.toString()).toBe(samplePdfRaw);
  });

  it("streams DOCX document correctly with 200 OK and proper headers", async () => {
    const sampleDocxRaw = "PK\x03\x04 fake docx binary data";
    const base64Content = Buffer.from(sampleDocxRaw).toString("base64");

    const mockFileRecord = {
      id: 43,
      schoolId: 1,
      filename: "worksheet.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: Buffer.byteLength(sampleDocxRaw),
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

    const req = new NextRequest("http://localhost:3002/api/files/43");
    const res = await GET(req, {
      params: Promise.resolve({ id: "43" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(res.headers.get("Content-Disposition")).toContain('inline; filename="worksheet.docx"');
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=3600");

    const arrayBuffer = await res.arrayBuffer();
    const resultBuffer = Buffer.from(arrayBuffer);
    expect(resultBuffer.toString()).toBe(sampleDocxRaw);
  });
});
