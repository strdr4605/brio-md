import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { runDoorAction } from "../tasmota";
import { createLogger } from "@/lib/logger";

const doorLogger = createLogger("door");

const doorPermissionProcedure = protectedProcedure.use(({ ctx, next }) => {
  const hasPermission =
    ctx.user.permissions.includes("open-front-door") ||
    ctx.user.permissions.includes("super") ||
    ctx.user.role === "superadmin";

  doorLogger.info("Door permission check", {
    userId: ctx.user.id,
    hasPermission,
  });

  if (!hasPermission) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Lipsă permisiunea de a deschide ușa" });
  }
  return next({ ctx });
});

let lastToggleTimestamp = 0;
const TOGGLE_COOLDOWN_MS = 2500;

export const doorRouter = router({
  toggle: doorPermissionProcedure
    .input(z.object({ action: z.enum(["open", "close"]) }))
    .mutation(async ({ ctx, input }) => {
      const now = Date.now();
      if (now - lastToggleTimestamp < TOGGLE_COOLDOWN_MS) {
        doorLogger.warn("Door toggle throttled", { userId: ctx.user.id });
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Vă rugăm să așteptați câteva secunde între comenzi.",
        });
      }
      lastToggleTimestamp = now;

      const { action } = input;
      doorLogger.info("Door toggle requested", { action, userId: ctx.user.id });

      const tasmotaIP = process.env.TASMOTA_IP;
      const tasmotaPort = process.env.TASMOTA_PORT || "1883";
      const tasmotaUser = process.env.TASMOTA_USER;
      const tasmotaPassword = process.env.TASMOTA_PASSWORD;

      if (!tasmotaIP || !tasmotaUser || !tasmotaPassword) {
        doorLogger.warn("Tasmota configuration missing");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Configurație Tasmota lipsă",
        });
      }

      doorLogger.info("Door sequence starting", { action });

      try {
        await runDoorAction(action, {
          ip: tasmotaIP,
          port: tasmotaPort,
          user: tasmotaUser,
          password: tasmotaPassword,
        });
        doorLogger.info("Door sequence complete", { action });
        return { success: true, action };
      } catch (error) {
        doorLogger.error("Door sequence failed", error as Error, { action });
        const message = (error as Error).message;
        const isTasmotaStatus = message.startsWith("Tasmota error:");
        throw new TRPCError({
          code: isTasmotaStatus ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
          message: isTasmotaStatus
            ? `Eroare Tasmota: ${message.split(": ")[1]}`
            : "Nu s-a putut accesa dispozitivul Tasmota",
        });
      }
    }),
});
