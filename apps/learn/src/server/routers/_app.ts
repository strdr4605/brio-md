import { router } from "../trpc";
import { courseRouter } from "./course";
import { teacherRouter } from "./teacher";
import { resourceRouter } from "./resource";
import { lessonRouter } from "./lesson";

export const appRouter = router({
  course: courseRouter,
  teacher: teacherRouter,
  resource: resourceRouter,
  lesson: lessonRouter,
});

export type AppRouter = typeof appRouter;

