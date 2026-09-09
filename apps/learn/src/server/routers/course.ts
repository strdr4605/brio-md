import { router, protectedProcedure } from "../trpc";
import { courses } from "@brio-md/db";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";

export const courseRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const courseIds = (ctx.user.courseIds || [])
      .map((id) => (typeof id === "number" ? id : parseInt(String(id), 10)))
      .filter((id) => !isNaN(id));

    if (courseIds.length === 0) {
      return [];
    }

    return db.select().from(courses).where(inArray(courses.id, courseIds));
  }),
});
