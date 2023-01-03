import { router } from "../trpc";
import { roomsRouter } from "./rooms";

export const appRouter = router({
  rooms: roomsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
