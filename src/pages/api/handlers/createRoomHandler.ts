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

      const room = roomData[roomConfig.code];

      if (room) {
        io.in(roomConfig.code).emit("roomWasCreated", {
          roomConfig: room.roomConfig,
          playerMetadata: room.players,
        });
      }

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
