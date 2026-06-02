import { z } from "zod";
import { router, superProcedure } from "../trpc";
import { permissionDefinitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";

export const permissionDefinitionRouter = router({
  list: superProcedure.query(async () => {
    return db.select().from(permissionDefinitions).orderBy(permissionDefinitions.key);
  }),

  create: superProcedure
    .input(
      z.object({
        key: z.string().min(1).max(100),
        label: z.string().min(1).max(255),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [result] = await db
        .insert(permissionDefinitions)
        .values(input)
        .returning();
      return result;
    }),

  update: superProcedure
    .input(
      z.object({
        id: z.number(),
        label: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const [result] = await db
        .update(permissionDefinitions)
        .set(updates)
        .where(eq(permissionDefinitions.id, id))
        .returning();
      return result;
    }),

  delete: superProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(permissionDefinitions).where(eq(permissionDefinitions.id, input.id));
      return { success: true };
    }),
});