import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "./storage";

describe("storage helper", () => {
  it("sanitizes filenames correctly to prevent path traversal and unsafe characters", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("Lectia 1 - Robotica & Algoritmi.pdf")).toBe(
      "lectia-1-robotica-algoritmi.pdf",
    );
    expect(sanitizeFilename("curs__video___intro.mp4")).toBe("curs-video-intro.mp4");
    expect(sanitizeFilename("document.test.final.PDF")).toBe("document.test.final.pdf");
  });
});
