import { type Server, type Socket } from "socket.io";
import generateDeckAndSqueakCards from "../../../utils/generateDeckAndSqueakCards";
import {
  type IMoveBackToLobby,
  type IGameData,
  type IRoomData,
  type IMiscRoomData,
} from "../socket";

interface IResetGame {
  gameIsFinished: boolean;
  resettingRoundFromExcessiveDeckRotations: boolean;
  roomCode: string;
}

export function resetGameHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData
) {
  function resetGame({
    gameIsFinished,
    resettingRoundFromExcessiveDeckRotations,
    roomCode,
  }: IResetGame) {
    const miscRoomDataObj = miscRoomData[roomCode];

    if (gameIsFinished) {
      const miscRoomDataObj = miscRoomData[roomCode];

      if (miscRoomDataObj) {
        clearInterval(miscRoomDataObj.gameStuckInterval);
      }

      const room = roomData[roomCode];
      const game = gameData[roomCode];

      if (!room || !game) return;

      for (const playerID of game.playerIDsThatLeftMidgame) {
        // remove player from room
        delete room.players[playerID];
        room.roomConfig.playersInRoom = room.roomConfig.playersInRoom - 1;
        room.roomConfig.hostUserID = Object.keys(room.players)[0] || "";
        room.roomConfig.hostUsername =
          Object.values(room.players)[0]?.username || "";

        // remove player from game
        delete game.players[playerID]; // maybe not needed? probably already starts with correct players when new game starts
      }

      room.roomConfig.gameStarted = false;

      const emitData: IMoveBackToLobby = {
        roomConfig: room.roomConfig,
        players: room.players,
        gameData: game,
      };

      io.in(roomCode).emit("moveBackToLobby", emitData);
      return;
    }

    const game = gameData[roomCode];

    if (!game) return;

    // resetting the board
    game.board = Array.from({ length: 4 }, () =>
      Array.from({ length: 5 }, () => null)
    );

    // resetting the player's data (minus their points/ranking)
    for (const playerID of Object.keys(game.players)) {
      const player = game.players[playerID];

      if (!player) return;

      // maybe have temp var that all of these go into and then set game.players to that?
      game.players = {
        ...game.players,
        [playerID]: {
          ...generateDeckAndSqueakCards(),
          totalPoints: player.totalPoints,
          rankInRoom: player.rankInRoom,
        },
      };
    }

    if (!resettingRoundFromExcessiveDeckRotations) {
      game.currentRound += 1;
    } else if (miscRoomDataObj) {
      miscRoomDataObj.rotateDecksCounter = 0;
    }

    if (miscRoomDataObj) {
      clearInterval(miscRoomDataObj.gameStuckInterval); // pretty sure this is necessary
    }

    io.in(roomCode).emit("startNewRound", game);
  }

  socket.on("resetGame", resetGame);
}
