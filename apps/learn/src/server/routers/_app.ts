import { router } from "../trpc";
import { courseRouter } from "./course";
import { teacherRouter } from "./teacher";
import { attendanceRouter } from "./attendance";

export const appRouter = router({
  course: courseRouter,
  teacher: teacherRouter,
  attendance: attendanceRouter,
});

export type AppRouter = typeof appRouter;

