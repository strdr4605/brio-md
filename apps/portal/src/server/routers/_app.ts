import { router } from "../trpc";
import { userRouter } from "./user";
import { permissionDefinitionRouter } from "./permission";
import { doorRouter } from "./door";

export const appRouter = router({
  user: userRouter,
  permissionDefinition: permissionDefinitionRouter,
  door: doorRouter,
});

export type AppRouter = typeof appRouter;
