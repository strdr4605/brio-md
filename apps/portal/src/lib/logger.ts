/* eslint-disable no-console */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "secret",
  "auth_secret",
  "authorization",
  "cookie",
]);

/**
 * Recursively redacts sensitive keys to prevent credential or secret leaks in logs.
 */
function maskSensitiveData(obj: any, depth = 0): any {
  if (depth > 4 || obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = maskSensitiveData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class Logger {
  private namespace: string;
  private minLevel: LogLevel;

  constructor(namespace = "app", minLevel?: LogLevel) {
    this.namespace = namespace;
    const envLevel =
      (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) ||
      (process.env.NODE_ENV === "production" ? "info" : "debug");
    this.minLevel = minLevel || envLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return (LOG_LEVELS[level] ?? 1) >= (LOG_LEVELS[this.minLevel] ?? 1);
  }

  private formatPayload(level: LogLevel, message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const cleanMeta = meta ? maskSensitiveData(meta) : undefined;
    return {
      timestamp,
      level: level.toUpperCase(),
      namespace: this.namespace,
      message,
      ...(cleanMeta ? { meta: cleanMeta } : {}),
    };
  }

  debug(message: string, meta?: Record<string, any>) {
    if (!this.shouldLog("debug")) return;
    const payload = this.formatPayload("debug", message, meta);
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(payload));
    } else {
      console.debug(`[${payload.timestamp}] [DEBUG] [${this.namespace}] ${message}`, meta ?? "");
    }
  }

  info(message: string, meta?: Record<string, any>) {
    if (!this.shouldLog("info")) return;
    const payload = this.formatPayload("info", message, meta);
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(payload));
    } else {
      console.info(`[${payload.timestamp}] [INFO] [${this.namespace}] ${message}`, meta ?? "");
    }
  }

  warn(message: string, meta?: Record<string, any>) {
    if (!this.shouldLog("warn")) return;
    const payload = this.formatPayload("warn", message, meta);
    if (process.env.NODE_ENV === "production") {
      console.warn(JSON.stringify(payload));
    } else {
      console.warn(`[${payload.timestamp}] [WARN] [${this.namespace}] ${message}`, meta ?? "");
    }
  }

  error(
    message: string,
    errorOrMeta?: Error | Record<string, any>,
    extraMeta?: Record<string, any>,
  ) {
    if (!this.shouldLog("error")) return;
    let errObj: Record<string, any> = {};
    if (errorOrMeta instanceof Error) {
      errObj = { errorMessage: errorOrMeta.message, stack: errorOrMeta.stack, ...extraMeta };
    } else if (errorOrMeta) {
      errObj = { ...errorOrMeta, ...extraMeta };
    }
    const payload = this.formatPayload("error", message, errObj);
    if (process.env.NODE_ENV === "production") {
      console.error(JSON.stringify(payload));
    } else {
      console.error(`[${payload.timestamp}] [ERROR] [${this.namespace}] ${message}`, errObj);
    }
  }

  child(subNamespace: string): Logger {
    return new Logger(`${this.namespace}:${subNamespace}`, this.minLevel);
  }
}

export const logger = new Logger("portal");
export const createLogger = (namespace: string, minLevel?: LogLevel) =>
  new Logger(namespace, minLevel);
