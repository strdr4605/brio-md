import { router } from "../trpc";
import { courseRouter } from "./course";
import { teacherRouter } from "./teacher";
import { resourceRouter } from "./resource";
import { lessonRouter } from "./lesson";
import { attendanceRouter } from "./attendance";

export const appRouter = router({
  course: courseRouter,
  teacher: teacherRouter,
  resource: resourceRouter,
  lesson: lessonRouter,
  attendance: attendanceRouter,
});

export type AppRouter = typeof appRouter;
