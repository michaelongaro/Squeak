import { type Server, type Socket } from "socket.io";
import {
  type IMiscRoomData,
  type IRoomData,
  type IRoomPlayer,
} from "../socket";
import { type IRoomConfig } from "~/pages/create";
import { prisma } from "~/server/db";

export function createRoomHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData,
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
        Array.from({ length: 5 }, () => 0),
      );

      miscRoomData[roomConfig.code] = {
        boardTimestamps,
        preventOtherPlayersFromSqueaking: false,
        botIntervals: [],
        blacklistedSqueakCards: {},
        currentVotes: [],
        voteType: null,
      };

      io.in(roomConfig.code).emit("roomWasCreated");

      await prisma.room.create({
        data: {
          pointsToWin: roomConfig.pointsToWin,
          maxPlayers: roomConfig.maxPlayers,
          isPublic: roomConfig.isPublic,
          playersInRoom: roomConfig.playersInRoom,
          playerIDsInRoom: [roomConfig.hostUserID],
          code: roomConfig.code,
          hostUsername: roomConfig.hostUsername,
          hostUserID: roomConfig.hostUserID,
          gameStarted: roomConfig.gameStarted,
        },
      });
    },
  );
}
