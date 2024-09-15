import { type Server, type Socket } from "socket.io";
import { type IMiscRoomData, type IGameData, type IRoomData } from "../socket";
import { prisma } from "~/server/db";

export function oldRoomCleanupCronHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData,
) {
  socket.on("oldRoomCleanupCron", async (code: string, callback) => {
    try {
      delete roomData[code];
      delete gameData[code];
      delete miscRoomData[code];

      await prisma.room.delete({
        where: {
          code: code,
        },
      });

      // Acknowledge that the cleanup has been completed
      if (callback) {
        callback({ status: "success", message: `Room ${code} cleaned up` });
      }
    } catch (error) {
      console.error("Error during room cleanup:", error);
      if (callback) {
        callback({
          status: "error",
          message: `Failed to clean up room ${code}`,
        });
      }
    }
  });
}
