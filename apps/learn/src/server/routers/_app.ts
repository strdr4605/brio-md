import { router } from "../trpc";
import { courseRouter } from "./course";
import { teacherRouter } from "./teacher";

export const appRouter = router({
  course: courseRouter,
  teacher: teacherRouter,
});

export type AppRouter = typeof appRouter;

