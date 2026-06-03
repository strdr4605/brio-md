import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const doorPermissionProcedure = protectedProcedure.use(({ ctx, next }) => {
  const hasPermission =
    ctx.user.permissions.includes("open-front-door") || ctx.user.permissions.includes("super");
  console.log(`[door] permission check for user ${ctx.user.id}: ${JSON.stringify(ctx.user.permissions)}, hasPermission: ${hasPermission}`);
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

      const cmd = action === "open" ? 3 : 2;
      const url = `http://${tasmotaIP}:${tasmotaPort}/cm?user=${tasmotaUser}&password=${tasmotaPassword}&cmnd=Power${cmd}%20On`;

      console.log(`[door] ${action} request to ${url}`);

      try {
        const response = await fetch(url, { method: "GET" });

        console.log(`[door] response status: ${response.status}`);

        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Eroare Tasmota: ${response.status}`,
          });
        }

        return { success: true, action };
      } catch (error) {
        console.error(`[door] error:`, error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nu s-a putut accesa dispozitivul Tasmota",
        });
      }
    }),
});