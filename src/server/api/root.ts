import { usersRouter } from "./routers/users";
import { createTRPCRouter } from "./trpc";
import { roomsRouter } from "./routers/rooms";
import { statsRouter } from "./routers/stats";
import { postSignUpRegistrationRouter } from "./routers/postSignUpRegistration";

export const appRouter = createTRPCRouter({
  rooms: roomsRouter,
  users: usersRouter,
  stats: statsRouter,
  postSignUpRegistration: postSignUpRegistrationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
