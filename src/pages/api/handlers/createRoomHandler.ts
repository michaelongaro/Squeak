import { type Server, type Socket } from "socket.io";
import {
  type IMiscRoomData,
  type IRoomData,
  type IRoomPlayer,
} from "../socket";
import { type IRoomConfig } from "../../../components/CreateRoom/CreateRoom";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function createRoomHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData
) {
  socket.on(
    "createRoom",
    async (roomConfig: IRoomConfig, playerMetadata: IRoomPlayer) => {
      socket.join(roomConfig.code);

      roomData[roomConfig.code] = {
        roomConfig,
        players: {
          [roomConfig.hostUserID]: playerMetadata,
        },
      };

      miscRoomData[roomConfig.code] = {
        numberOfPlayersReady: 0,
        rotateDecksCounter: 0,
        preventOtherPlayersFromSqueaking: false,
      };

      await prisma.room.create({
        data: {
          pointsToWin: roomConfig.pointsToWin,
          maxPlayers: roomConfig.maxPlayers,
          isPublic: roomConfig.isPublic,
          playersInRoom: roomConfig.playersInRoom,
          code: roomConfig.code,
          hostUsername: roomConfig.hostUsername,
          hostUserID: roomConfig.hostUserID,
          gameStarted: roomConfig.gameStarted,
        },
      });

      io.in(roomConfig.code).emit("roomWasCreated");
    }
  );
}
