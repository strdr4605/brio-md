export const STAFF_PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3002"
    : "https://in.brio.md");

export const LEARNING_PORTAL_URL =
  process.env.NEXT_PUBLIC_LEARN_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3003"
    : "https://learn.brio.md");
