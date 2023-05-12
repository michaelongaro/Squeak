import { type Server, type Socket } from "socket.io";
import { type IRoomConfig } from "../../../components/CreateRoom/CreateRoom";
import { type IRoomData } from "../socket";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        code: room.roomConfig.code,
        hostUsername: room.roomConfig.hostUsername,
        hostUserID: room.roomConfig.hostUserID,
        gameStarted: room.roomConfig.gameStarted,
      },
    });
  });
}
