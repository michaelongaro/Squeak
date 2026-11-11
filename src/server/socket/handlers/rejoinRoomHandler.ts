import type { PlayerSocket as Socket } from "~/types/socket";
import { type Server } from "socket.io";
import {
  type IGameMetadata,
  type IGameData,
  type IRejoinData,
  type IRoomData,
  type IMiscRoomData,
} from "~/types/socket";
import { prisma } from "~/server/db";

interface IJoinRoomConfig {
  code: string;
  userID: string;
}

export function rejoinRoomHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData,
) {
  socket.on(
    "rejoinRoom",
    async (
      { userID, code }: IJoinRoomConfig,
      callback?: (response?: "gameStarted") => void,
    ) => {
      const room = roomData[code];
      const players = roomData[code]?.players;
      const game = gameData[code];
      const miscRoomDataObj = miscRoomData[code];

      if (!room || !players || !players[userID] || !miscRoomDataObj) return;

      if (!players[userID]?.botDifficulty) socket.data.playerID = userID;
      void socket.join(code);

      if (game?.playerIDsThatLeftMidgame?.includes(userID)) {
        game.playerIDsThatLeftMidgame = game.playerIDsThatLeftMidgame.filter(
          (id) => id !== userID,
        );

        room.roomConfig.playersInRoom++;
        room.roomConfig.playerIDsInRoom.push(userID);

        await prisma.room.update({
          where: {
            code,
          },
          data: {
            playersInRoom: room.roomConfig.playersInRoom,
            playerIDsInRoom: Object.keys(room.players),
          },
        });
      }

      const rejoinData: IRejoinData = {
        userID,
        roomConfig: room.roomConfig,
        gameData: game === undefined ? ({} as IGameMetadata) : game,
        players: room.players,
        scoreboardMetadata: miscRoomDataObj.scoreboardMetadata,
      };

      io.in(code).emit("rejoinData", rejoinData);

      callback?.(room.roomConfig.gameStarted ? "gameStarted" : undefined);
    },
  );
}
