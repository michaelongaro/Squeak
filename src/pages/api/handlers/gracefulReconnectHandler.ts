import { type Server, type Socket } from "socket.io";
import { prisma } from "~/server/db";

export function gracefulReconnectHandler(io: Server, socket: Socket) {
  socket.on(
    "attemptToGracefullyReconnectToRoom",
    async ({ roomCode, userID }: { roomCode: string; userID: string }) => {
      const room = await prisma.room.findUnique({
        where: {
          code: roomCode,
          playerIDsInRoom: {
            has: userID,
          },
        },
        select: {
          code: true,
        },
      });

      if (room) {
        socket.join(roomCode);
      }
    },
  );
}
