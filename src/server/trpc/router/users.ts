import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const usersRouter = router({
  getUserByID: publicProcedure // maybe go protected if it still will return null on "" input
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

  getUsersFromIDList: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      if (input.length === 0) return [];

      try {
        const users = ctx.prisma.user.findMany({
          where: {
            id: { in: input },
          },
        });

        return users;
      } catch (error) {
        console.log(error);
      }
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        username: z.string(),
        avatarPath: z.string(),
        color: z.string(),
        deckHueRotation: z.number(),
        squeakPileOnLeft: z.boolean(),
        desktopNotifications: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.user.update({
          where: {
            id: input.id,
          },
          data: {
            username: input.username,
            avatarPath: input.avatarPath,
            color: input.color,
            deckHueRotation: input.deckHueRotation,
            squeakPileOnLeft: input.squeakPileOnLeft,
            desktopNotifications: input.desktopNotifications,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
});
