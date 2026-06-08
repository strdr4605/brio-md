import { router } from "../trpc";
import { userRouter } from "./user";
import { permissionDefinitionRouter } from "./permission";
import { doorRouter } from "./door";
import { courseRouter } from "./course";
import { groupRouter } from "./group";
import { enrollmentRouter } from "./enrollment";
import { groupSessionRouter } from "./groupSession";
import { attendanceRouter } from "./attendance";
import { studentRouter } from "./student";

export const appRouter = router({
  user: userRouter,
  permissionDefinition: permissionDefinitionRouter,
  door: doorRouter,
  course: courseRouter,
  group: groupRouter,
  enrollment: enrollmentRouter,
  groupSession: groupSessionRouter,
  attendance: attendanceRouter,
  student: studentRouter,
});

export type AppRouter = typeof appRouter;
