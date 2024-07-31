import { type Server, type Socket } from "socket.io";
import {
  type IGameMetadata,
  type IGameData,
  type IRejoinData,
  type IRoomData,
} from "../socket";

interface IJoinRoomConfig {
  code: string;
  userID: string;
}

export function rejoinRoomHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
) {
  socket.on(
    "rejoinRoom",
    async ({ userID, code }: IJoinRoomConfig, callback) => {
      const room = roomData[code];
      const players = roomData[code]?.players;
      const game = gameData[code];

      if (!room || !players) return;

      socket.join(code);

      if (game?.playerIDsThatLeftMidgame.includes(userID)) {
        game.playerIDsThatLeftMidgame = game.playerIDsThatLeftMidgame.filter(
          (id) => id !== userID,
        );
      }

      const rejoinData: IRejoinData = {
        userID,
        roomConfig: room.roomConfig,
        gameData: game === undefined ? ({} as IGameMetadata) : game,
        players: room.players,
      };

      io.in(code).emit("rejoinData", rejoinData);

      callback?.(room.roomConfig.gameStarted ? "gameStarted" : undefined);
    },
  );
}
