import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const roomsRouter = router({
  createRoom: publicProcedure
    .input(
      z.object({
        pointsToWin: z.number(),
        maxRounds: z.number(),
        maxPlayers: z.number(),
        playersInRoom: z.number(),
        isPublic: z.boolean(),
        code: z.string(),
        hostUsername: z.string(),
        hostUserID: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const newRoom = await ctx.prisma.room.create({
          data: {
            pointsToWin: input.pointsToWin,
            maxRounds: input.maxRounds,
            maxPlayers: input.maxPlayers,
            isPublic: input.isPublic,
            playersInRoom: input.playersInRoom,
            code: input.code,
            hostUsername: input.hostUsername,
            hostUserID: input.hostUserID,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
  findRoomByCode: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const room = await ctx.prisma.room.findUnique({
          where: {
            code: input,
          },
        });
        return room;
      } catch (error) {
        console.log(error);
      }
    }),
});
