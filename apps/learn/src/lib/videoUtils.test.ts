import { describe, it, expect } from "vitest";
import { parseVideoSource } from "./videoUtils";

describe("parseVideoSource", () => {
  it("detects direct video files correctly", () => {
    const res = parseVideoSource("http://localhost:9000/brio-media/resources/lesson1.mp4");
    expect(res.provider).toBe("direct");
    expect(res.isDirectVideo).toBe(true);
    expect(res.embedUrl).toBe("http://localhost:9000/brio-media/resources/lesson1.mp4");
  });

  it("normalizes YouTube watch URLs to embed format", () => {
    const res = parseVideoSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(res.provider).toBe("youtube");
    expect(res.isDirectVideo).toBe(false);
    expect(res.embedUrl).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("normalizes youtu.be short URLs to embed format", () => {
    const res = parseVideoSource("https://youtu.be/dQw4w9WgXcQ?t=10");
    expect(res.provider).toBe("youtube");
    expect(res.embedUrl).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("normalizes YouTube Shorts URLs to embed format", () => {
    const res = parseVideoSource("https://www.youtube.com/shorts/dQw4w9WgXcQ");
    expect(res.provider).toBe("youtube");
    expect(res.embedUrl).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("normalizes Google Drive view URLs to preview format", () => {
    const res = parseVideoSource("https://drive.google.com/file/d/1A2B3C4D5E/view?usp=sharing");
    expect(res.provider).toBe("drive");
    expect(res.embedUrl).toBe("https://drive.google.com/file/d/1A2B3C4D5E/preview");
  });

  it("normalizes Vimeo URLs to player format", () => {
    const res = parseVideoSource("https://vimeo.com/76979871");
    expect(res.provider).toBe("vimeo");
    expect(res.embedUrl).toBe("https://player.vimeo.com/video/76979871");
  });

  it("handles youtube-nocookie embed URLs", () => {
    const res = parseVideoSource("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(res.provider).toBe("youtube");
    expect(res.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });
});
