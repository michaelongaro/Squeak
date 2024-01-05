import { type Server, type Socket } from "socket.io";
import generateDeckAndSqueakCards from "../../../utils/generateDeckAndSqueakCards";
import {
  type IMoveBackToLobby,
  type IGameData,
  type IRoomData,
  type IGameMetadata,
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

    // this was repeated twice below, but I don't see why that was necessary
    // be wary though

    if (miscRoomDataObj) {
      miscRoomDataObj.preventOtherPlayersFromSqueaking = false;
      clearInterval(miscRoomDataObj.gameStuckInterval);

      // clear any bot intervals
      for (const botInterval of miscRoomDataObj.botIntervals || []) {
        clearInterval(botInterval);
      }

      // TODO: technically shouldn't we removing the resulting intervalID from the array after clearing it?
    }

    const room = roomData[roomCode];
    const game = gameData[roomCode];

    if (!room || !game) return;

    if (gameIsFinished) {
      for (const playerID of game.playerIDsThatLeftMidgame) {
        // remove player from room
        delete room.players[playerID];
        room.roomConfig.playersInRoom--;

        // assigning new host if the host left
        if (playerID === room.roomConfig.hostUserID) {
          room.roomConfig.hostUserID = Object.keys(room.players)[0] || "";
          room.roomConfig.hostUsername =
            Object.values(room.players)[0]?.username || "";
        }
      }

      gameData[roomCode] = {} as IGameMetadata;

      room.roomConfig.gameStarted = false;

      const emitData: IMoveBackToLobby = {
        roomConfig: room.roomConfig,
        players: room.players,
        gameData: {} as IGameMetadata,
      };

      io.in(roomCode).emit("moveBackToLobby", emitData);

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
      return;
    }

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

    // pick a random (human) player to start the next round
    const playerIDs = Object.keys(game.players);
    let randomPlayerID;

    let foundValidPlayerID = false;
    while (!foundValidPlayerID) {
      const randomPlayerID =
        playerIDs[Math.floor(Math.random() * playerIDs.length)];
      if (
        randomPlayerID &&
        room.players[randomPlayerID]?.botDifficulty === undefined &&
        !game.playerIDsThatLeftMidgame.includes(randomPlayerID)
      ) {
        foundValidPlayerID = true;
      }
    }

    io.in(roomCode).emit("startNewRound", {
      roomCode: roomCode,
      gameData: game,
      playerIDToStartNextRound: randomPlayerID,
    });
  }

  socket.on("resetGame", resetGame);
}
