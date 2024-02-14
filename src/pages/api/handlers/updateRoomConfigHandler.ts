import { type Server, type Socket } from "socket.io";
import { type IRoomConfig } from "~/pages/create";
import { type IRoomData } from "../socket";
import { prisma } from "~/server/db";

export function updateRoomConfigHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData
) {
  socket.on("updateRoomConfig", async (roomConfig: IRoomConfig) => {
    const room = roomData[roomConfig.code];

    if (!room || !prisma) return;
    room.roomConfig = roomConfig;

    io.in(roomConfig.code).emit("roomConfigUpdated", roomConfig);

    await prisma.room.update({
      where: {
        code: roomConfig.code,
      },
      data: {
        pointsToWin: room.roomConfig.pointsToWin,
        maxPlayers: room.roomConfig.maxPlayers,
        isPublic: room.roomConfig.isPublic,
        playersInRoom: room.roomConfig.playersInRoom,
        playerIDsInRoom: Object.keys(room.players),
        code: room.roomConfig.code,
        hostUsername: room.roomConfig.hostUsername,
        hostUserID: room.roomConfig.hostUserID,
        gameStarted: room.roomConfig.gameStarted,
      },
    });
  });
}
