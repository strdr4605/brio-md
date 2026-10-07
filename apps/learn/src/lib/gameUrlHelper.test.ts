import { describe, it, expect } from "vitest";
import { normalizeGameUrl, TEST_GAME_PRESETS } from "./gameUrlHelper";

describe("gameUrlHelper", () => {
  it("normalizes Scratch project URLs into their embed format", () => {
    const raw = "https://scratch.mit.edu/projects/10128407/";
    const result = normalizeGameUrl(raw);

    expect(result.provider).toBe("scratch");
    expect(result.isEmbedFriendly).toBe(true);
    expect(result.embedUrl).toBe("https://scratch.mit.edu/projects/10128407/embed");
    expect(result.url).toBe("https://scratch.mit.edu/projects/10128407/");
  });

  it("handles Scratch URLs without trailing slashes or already embedded", () => {
    const raw = "scratch.mit.edu/projects/28848418";
    const result = normalizeGameUrl(raw);

    expect(result.provider).toBe("scratch");
    expect(result.embedUrl).toBe("https://scratch.mit.edu/projects/28848418/embed");
  });

  it("normalizes Wordwall resource URLs into embed URLs", () => {
    const raw = "https://wordwall.net/resource/1808846";
    const result = normalizeGameUrl(raw);

    expect(result.provider).toBe("wordwall");
    expect(result.isEmbedFriendly).toBe(true);
    expect(result.embedUrl).toBe("https://wordwall.net/embed/1808846");
  });

  it("recognizes PhET simulations as embed friendly", () => {
    const raw =
      "https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher_all.html";
    const result = normalizeGameUrl(raw);

    expect(result.provider).toBe("phet");
    expect(result.isEmbedFriendly).toBe(true);
    expect(result.embedUrl).toBe(raw);
  });

  it("normalizes GeoGebra materials into iframe embed links", () => {
    const raw = "https://www.geogebra.org/m/e6sghwcy";
    const result = normalizeGameUrl(raw);

    expect(result.provider).toBe("geogebra");
    expect(result.isEmbedFriendly).toBe(true);
    expect(result.embedUrl).toBe(
      "https://www.geogebra.org/material/iframe/id/e6sghwcy",
    );
  });

  it("handles generic custom URLs gracefully", () => {
    const raw = "https://coolmathgames.com/0-run-3";
    const result = normalizeGameUrl(raw);

    expect(result.provider).toBe("custom");
    expect(result.isEmbedFriendly).toBe(false);
    expect(result.embedUrl).toBe(raw);
    expect(result.url).toBe(raw);
  });

  it("handles empty or whitespace strings", () => {
    const result = normalizeGameUrl("   ");
    expect(result.url).toBe("");
    expect(result.embedUrl).toBe("");
    expect(result.isEmbedFriendly).toBe(false);
  });

  it("exports valid test game presets", () => {
    expect(TEST_GAME_PRESETS.length).toBeGreaterThanOrEqual(3);
    for (const preset of TEST_GAME_PRESETS) {
      expect(preset.title).toBeTruthy();
      expect(preset.url).toMatch(/^https?:\/\//);
      expect(preset.embedUrl).toMatch(/^https?:\/\//);
      expect(preset.maxScore).toBeGreaterThan(0);
      expect(preset.instructions).toBeTruthy();
    }
  });
});
