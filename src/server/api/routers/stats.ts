import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const statsRouter = createTRPCRouter({
  initializeUser: publicProcedure // maybe go protected if it still will return null on "" input
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (input === "") return null;

      try {
        const user = await ctx.prisma.stats.create({
          data: {
            userID: input,
          },
        });
        return user;
      } catch (error) {
        console.log(error);
      }

      return null;
    }),
  getStatsByID: publicProcedure // maybe go protected if it still will return null on "" input
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (input === "") return null;

      try {
        const user = await ctx.prisma.stats.findUnique({
          where: {
            userID: input,
          },
        });
        return user;
      } catch (error) {
        console.log(error);
      }

      return null;
    }),
});
