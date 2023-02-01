import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const usersRouter = router({
  getUserByID: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (input === "") return null;

      try {
        const user = await ctx.prisma.user.findUnique({
          where: {
            id: input,
          },
        });
        return user;
      } catch (error) {
        console.log(error);
      }

      return null;
    }),
});
