import { usersRouter } from "./users";
import { router } from "../trpc";
import { roomsRouter } from "./rooms";
import { statsRouter } from "./stats";

export const appRouter = router({
  rooms: roomsRouter,
  users: usersRouter,
  stats: statsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
