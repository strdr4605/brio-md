import { router } from "../trpc";
import { userRouter } from "./user";
import { permissionDefinitionRouter } from "./permission";
import { doorRouter } from "./door";
import { studentRouter } from "./student";
import { courseRouter } from "./course";
import { attendanceRouter } from "./attendance";

export const appRouter = router({
  user: userRouter,
  permissionDefinition: permissionDefinitionRouter,
  door: doorRouter,
  student: studentRouter,
  course: courseRouter,
  attendance: attendanceRouter,
});

export type AppRouter = typeof appRouter;

