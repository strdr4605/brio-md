import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getSchoolDetailsService, updateSchoolDetailsService } from "../schoolService";

export const schoolRouter = router({
  getDetails: protectedProcedure
    .input(
      z
        .object({
          schoolId: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const permissions = ctx.user.permissions || [];
      const isSuper = permissions.includes("super") || ctx.user.role === "superadmin";
      const targetSchoolId = isSuper ? (input?.schoolId ?? ctx.user.schoolId) : ctx.user.schoolId;

      if (!targetSchoolId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Niciun campus școlar asociat utilizatorului",
        });
      }

      return getSchoolDetailsService(targetSchoolId);
    }),

  updateDetails: adminProcedure
    .input(
      z.object({
        schoolId: z.number().optional(),
        name: z.string().min(1).max(255).optional(),
        address: z.string().max(500).nullable().optional(),
        phone: z.string().max(50).nullable().optional(),
        email: z.string().email().max(255).or(z.literal("")).nullable().optional(),
        bankName: z.string().max(255).nullable().optional(),
        iban: z.string().max(100).nullable().optional(),
        fiscalCode: z.string().max(100).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const permissions = ctx.user.permissions || [];
      const isSuper = permissions.includes("super") || ctx.user.role === "superadmin";

      const targetSchoolId = isSuper ? (input.schoolId ?? ctx.user.schoolId) : ctx.user.schoolId;

      if (!targetSchoolId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Niciun campus școlar specificat",
        });
      }

      if (!isSuper && input.schoolId && input.schoolId !== ctx.user.schoolId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nu puteți modifica datele altei școli",
        });
      }

      const { schoolId: _, ...updates } = input;
      return updateSchoolDetailsService(targetSchoolId, updates);
    }),
});
