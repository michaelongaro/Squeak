import { type Server, type Socket } from "socket.io";
import generateDeckAndSqueakCards from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../socket";

interface IResetGame {
  gameIsFinished: boolean;
  roomCode: string;
}

export function resetGameHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  gameStuckInterval: NodeJS.Timeout
) {
  function resetGame({ gameIsFinished, roomCode }: IResetGame) {
    if (gameIsFinished) {
      clearInterval(gameStuckInterval); // pretty sure this is necessary
      io.in(roomCode).emit("moveBackToLobby");
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

    game.currentRound = game.currentRound + 1;

    clearInterval(gameStuckInterval);

    io.in(roomCode).emit("startNewRound", game);
  }

  socket.on("resetGame", resetGame);
}
