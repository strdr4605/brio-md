import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, MAX_FILE_SIZE_BYTES } from "./route";
import { NextRequest } from "next/server";

vi.mock("@brio-md/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  uploadFileToStorage: vi.fn().mockResolvedValue({
    url: "http://localhost:9000/brio-media/resources/test.pdf",
    key: "resources/test.pdf",
    size: 1024,
    contentType: "application/pdf",
  }),
}));

import { auth } from "@brio-md/auth";

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new NextRequest("http://localhost:3003/api/upload", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Autentificare necesară");
  });

  it("returns 403 when user is a student without teacher permissions", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", role: "student", permissions: [] },
    } as any);

    const req = new NextRequest("http://localhost:3003/api/upload", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Doar profesorii");
  });

  it("returns 400 when no file is uploaded in formData", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "2", role: "teacher", permissions: ["teach"] },
    } as any);

    const formData = new FormData();
    const req = new NextRequest("http://localhost:3003/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Niciun fișier valid");
  });

  it("returns 413 when file exceeds max size limit", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "2", role: "teacher", permissions: ["teach"] },
    } as any);

    const fakeFile = new Blob(["test"], { type: "application/pdf" });
    Object.defineProperty(fakeFile, "size", { value: MAX_FILE_SIZE_BYTES + 1024 });

    const req = {
      formData: async () => ({
        get: (key: string) => (key === "file" ? fakeFile : null),
      }),
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("uploads successfully for authenticated teacher with valid file", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "2", role: "teacher", permissions: ["teach"] },
    } as any);

    const formData = new FormData();
    const blob = new Blob(["test content"], { type: "application/pdf" });
    const file = new File([blob], "curs.pdf", { type: "application/pdf" });
    formData.append("file", file);

    const req = new NextRequest("http://localhost:3003/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.url).toBe("http://localhost:9000/brio-media/resources/test.pdf");
  });

  it("accepts .doc and .docx files even if browser sends application/octet-stream MIME type", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "2", role: "teacher", permissions: ["teach"] },
    } as any);

    const formData = new FormData();
    const blob = new Blob(["doc binary content"], { type: "application/octet-stream" });
    const file = new File([blob], "exercitii.doc", { type: "application/octet-stream" });
    formData.append("file", file);

    const req = new NextRequest("http://localhost:3003/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.originalName).toBe("exercitii.doc");
  });
});
