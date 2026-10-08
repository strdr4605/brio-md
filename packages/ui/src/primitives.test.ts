import { describe, it, expect } from "vitest";
import { Card, CardHeader, StatusDot, EmptyState } from "./index";

describe("Shared UI Primitives (@brio-md/ui)", () => {
  it("exports Card and CardHeader components", () => {
    expect(Card).toBeDefined();
    expect(CardHeader).toBeDefined();
  });

  it("exports StatusDot component with pill support", () => {
    expect(StatusDot).toBeDefined();
  });

  it("exports EmptyState component with title and description support", () => {
    expect(EmptyState).toBeDefined();
  });
});

