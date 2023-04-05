import { type Server, type Socket } from "socket.io";
import generateDeckAndSqueakCards from "../../../utils/generateDeckAndSqueakCards";
import {
  type IMoveBackToLobby,
  type IGameData,
  type IRoomData,
  type IMiscRoomData,
  type IPlayerCardsMetadata,
} from "../socket";
import { PrismaClient } from "@prisma/client";

interface IResetGame {
  gameIsFinished: boolean;
  resettingRoundFromExcessiveDeckRotations: boolean;
  roomCode: string;
}

const prisma = new PrismaClient();

export function resetGameHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData
) {
  async function resetGame({
    gameIsFinished,
    resettingRoundFromExcessiveDeckRotations,
    roomCode,
  }: IResetGame) {
    const miscRoomDataObj = miscRoomData[roomCode];

    if (gameIsFinished) {
      const miscRoomDataObj = miscRoomData[roomCode];

      if (miscRoomDataObj) {
        miscRoomDataObj.preventOtherPlayersFromSqueaking = false;
        clearInterval(miscRoomDataObj.gameStuckInterval);
      }

      const room = roomData[roomCode];
      const game = gameData[roomCode];

      if (!room || !game) return;

      for (const playerID of game.playerIDsThatLeftMidgame) {
        // remove player from room
        delete room.players[playerID];
        room.roomConfig.playersInRoom--;
        room.roomConfig.hostUserID = Object.keys(room.players)[0] || "";
        room.roomConfig.hostUsername =
          Object.values(room.players)[0]?.username || "";

        // remove player from game
        delete game.players[playerID]; // maybe not needed? probably already starts with correct players when new game starts
      }

      room.roomConfig.gameStarted = false;

      if (prisma) {
        await prisma.room.update({
          where: {
            code: roomCode,
          },
          data: {
            playersInRoom: room.roomConfig.playersInRoom,
            hostUserID: room.roomConfig.hostUserID,
            hostUsername: room.roomConfig.hostUsername,
            gameStarted: room.roomConfig.gameStarted,
          },
        });
      }

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

    const tempNewPlayerCardMetadata = {} as IPlayerCardsMetadata;

    // giving each player a new deck and updating their total points/rank
    for (const playerID of Object.keys(game.players)) {
      const player = game.players[playerID];

      if (!player) return;

      const newCards = generateDeckAndSqueakCards();

      tempNewPlayerCardMetadata[playerID] = {
        ...newCards,
        totalPoints: player.totalPoints,
        rankInRoom: player.rankInRoom,
      };
    }

    // appending the new player card metadata to the game object
    game.players = tempNewPlayerCardMetadata;

    if (!resettingRoundFromExcessiveDeckRotations) {
      game.currentRound += 1;
    } else if (miscRoomDataObj) {
      miscRoomDataObj.rotateDecksCounter = 0;
    }

    if (miscRoomDataObj) {
      miscRoomDataObj.preventOtherPlayersFromSqueaking = false;
      clearInterval(miscRoomDataObj.gameStuckInterval);
    }

    // pick a random player to start the next round
    const playerIDs = Object.keys(game.players);
    const randomPlayerID =
      playerIDs[Math.floor(Math.random() * playerIDs.length)];

    io.in(roomCode).emit("startNewRound", {
      gameData: game,
      playerIDToStartNextRound: randomPlayerID,
    });
  }

  socket.on("resetGame", resetGame);
}
