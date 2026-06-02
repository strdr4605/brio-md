import { router } from "../trpc";
import { userRouter } from "./user";
import { permissionDefinitionRouter } from "./permission";

export const appRouter = router({
  user: userRouter,
  permissionDefinition: permissionDefinitionRouter,
});

export type AppRouter = typeof appRouter;
