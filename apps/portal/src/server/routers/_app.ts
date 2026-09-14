import { router } from "../trpc";
import { userRouter } from "./user";
import { permissionDefinitionRouter } from "./permission";
import { doorRouter } from "./door";
import { studentRouter } from "./student";
import { courseRouter } from "./course";
import { attendanceRouter } from "./attendance";
import { groupRouter } from "./group";
import { enrollmentRouter } from "./enrollment";

export const appRouter = router({
  user: userRouter,
  permissionDefinition: permissionDefinitionRouter,
  door: doorRouter,
  student: studentRouter,
  course: courseRouter,
  attendance: attendanceRouter,
  group: groupRouter,
  enrollment: enrollmentRouter,
});

export type AppRouter = typeof appRouter;

