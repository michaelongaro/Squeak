import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const statsRouter = createTRPCRouter({
  initializeUser: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (input === "") return null;
      if (input !== ctx.auth.userId) throw new TRPCError({ code: "FORBIDDEN" });

      try {
        const user = await ctx.prisma.stats.upsert({
          where: { userID: input },
          update: {},
          create: {
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
