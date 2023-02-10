import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const roomsRouter = router({
  createRoom: publicProcedure
    .input(
      z.object({
        pointsToWin: z.number(),
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
        await ctx.prisma.room.create({
          data: {
            pointsToWin: input.pointsToWin,
            maxPlayers: input.maxPlayers,
            isPublic: input.isPublic,
            playersInRoom: input.playersInRoom,
            code: input.code,
            hostUsername: input.hostUsername,
            hostUserID: input.hostUserID,
            gameStarted: false,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
  getAllAvailableRooms: publicProcedure.query(async ({ ctx }) => {
    try {
      const rooms = await ctx.prisma.room.findMany({
        where: {
          isPublic: true,
          gameStarted: false,
          playersInRoom: { lt: 4 },
        },
      });
      return rooms;
    } catch (error) {
      console.log(error);
    }
  }),
  findRoomByCode: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (input === "") return null;

      try {
        const room = await ctx.prisma.room.findFirst({
          where: {
            code: input,
            gameStarted: false,
            playersInRoom: { lt: 4 },
          },
        });
        return room;
      } catch (error) {
        console.log(error);
      }
    }),
  updateRoomConfig: publicProcedure
    .input(
      z.object({
        pointsToWin: z.number(),
        maxPlayers: z.number(),
        playersInRoom: z.number(),
        isPublic: z.boolean(),
        code: z.string(),
        hostUsername: z.string(),
        hostUserID: z.string(),
        gameStarted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.room.update({
          where: {
            code: input.code,
          },
          data: {
            pointsToWin: input.pointsToWin,
            maxPlayers: input.maxPlayers,
            isPublic: input.isPublic,
            playersInRoom: input.playersInRoom,
            code: input.code,
            hostUsername: input.hostUsername,
            hostUserID: input.hostUserID,
            gameStarted: input.gameStarted,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
  deleteRoom: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.room.delete({
          where: {
            code: input,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
});
