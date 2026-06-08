import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { runDoorAction } from "../tasmota";

const doorPermissionProcedure = protectedProcedure.use(({ ctx, next }) => {
  const hasPermission =
    ctx.user.permissions.includes("open-front-door") || ctx.user.permissions.includes("super");
  console.log(
    `[door] permission check for user ${ctx.user.id}: ${JSON.stringify(ctx.user.permissions)}, hasPermission: ${hasPermission}`,
  );
  if (!hasPermission) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Lipsă permisiunea de a deschide ușa" });
  }
  return next({ ctx });
});

export const doorRouter = router({
  toggle: doorPermissionProcedure
    .input(z.object({ action: z.enum(["open", "close"]) }))
    .mutation(async ({ ctx, input }) => {
      const { action } = input;
      console.log(`[door] toggle request: ${action} by user ${ctx.user.id}`);

      const tasmotaIP = process.env.TASMOTA_IP;
      const tasmotaPort = process.env.TASMOTA_PORT || "1883";
      const tasmotaUser = process.env.TASMOTA_USER;
      const tasmotaPassword = process.env.TASMOTA_PASSWORD;

      if (!tasmotaIP || !tasmotaUser || !tasmotaPassword) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Configurație Tasmota lipsă",
        });
      }

      console.log(`[door] ${action} sequence starting`);

      try {
        await runDoorAction(action, {
          ip: tasmotaIP,
          port: tasmotaPort,
          user: tasmotaUser,
          password: tasmotaPassword,
        });
        console.log(`[door] ${action} sequence complete`);
        return { success: true, action };
      } catch (error) {
        console.error(`[door] error:`, error);
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
