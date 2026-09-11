import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger } from "./logger";

describe("Logger", () => {
  let consoleLogSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;
  const originalEnv = process.env.NODE_ENV;
  const setEnv = (val?: string) => {
    (process.env as Record<string, string | undefined>).NODE_ENV = val;
  };

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setEnv(originalEnv);
  });

  it("outputs human-readable logs in development mode", () => {
    setEnv("development");
    const log = createLogger("dev-test", "debug");
    log.info("App initialized");
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
  });

  it("redacts sensitive fields like passwords and tokens in metadata", () => {
    setEnv("production");
    const log = createLogger("security-test", "debug");

    log.info("User logged in", {
      user: "alice",
      password: "secretpassword",
      nested: {
        token: "jwt.secret.token",
        safeData: 123,
      },
    });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(parsed.namespace).toBe("security-test");
    expect(parsed.level).toBe("INFO");
    expect(parsed.message).toBe("User logged in");
    expect(parsed.meta.user).toBe("alice");
    expect(parsed.meta.password).toBe("***REDACTED***");
    expect(parsed.meta.nested.token).toBe("***REDACTED***");
    expect(parsed.meta.nested.safeData).toBe(123);
  });

  it("formats Error objects with message and stack in error logs", () => {
    setEnv("production");
    const log = createLogger("error-test", "error");
    const error = new Error("Database timeout");

    log.error("Query failed", error, { queryId: "q_42" });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(parsed.level).toBe("ERROR");
    expect(parsed.meta.errorMessage).toBe("Database timeout");
    expect(parsed.meta.stack).toBeDefined();
    expect(parsed.meta.queryId).toBe("q_42");
  });

  it("respects log level thresholds", () => {
    setEnv("production");
    const log = createLogger("threshold-test", "warn");

    log.debug("Hidden debug");
    log.info("Hidden info");
    log.warn("Visible warn");
    log.error("Visible error");

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("creates child loggers with compounded namespaces", () => {
    setEnv("production");
    const parent = createLogger("parent", "info");
    const child = parent.child("child");

    child.info("Hello from child");

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(parsed.namespace).toBe("parent:child");
  });
});
