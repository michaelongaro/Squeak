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

      const boardTimestamps = Array.from({ length: 4 }, () =>
        Array.from({ length: 5 }, () => 0)
      );

      miscRoomData[roomConfig.code] = {
        boardTimestamps,
        numberOfPlayersReady: 0,
        rotateDecksCounter: 0,
        preventOtherPlayersFromSqueaking: false,
        botIntervals: [],
        blacklistedSqueakCards: {},
      };

      io.in(roomConfig.code).emit("roomWasCreated");

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
    }
  );
}
