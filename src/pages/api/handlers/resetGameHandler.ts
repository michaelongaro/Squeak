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
  async function resetGame({ gameIsFinished, roomCode }: IResetGame) {
    const miscRoomDataObj = miscRoomData[roomCode];

    if (miscRoomDataObj) {
      miscRoomDataObj.preventOtherPlayersFromSqueaking = false;
    }

    const room = roomData[roomCode];
    const game = gameData[roomCode];

    if (!room || !game) return;

    if (gameIsFinished) {
      for (const playerID of game.playerIDsThatLeftMidgame) {
        // remove player from room
        delete room.players[playerID];
        room.roomConfig.playersInRoom--;

        const playerIDsPresentlyInRoom = Object.keys(room.players).filter(
          (playerID) =>
            !game?.playerIDsThatLeftMidgame.includes(playerID) &&
            !room.players[playerID]?.botDifficulty
        );

        // assign a new host (if available) if the host left
        if (
          playerID === room.roomConfig.hostUserID &&
          playerIDsPresentlyInRoom.length > 0
          // TODO: sanity check: is this even necessary to check since wouldn't all the players
          // leaving have gone through the leaveRoomHandler and deleted the whole room/game?
        ) {
          const newHostID = playerIDsPresentlyInRoom[0] as string; // we know this will exist and be a string

          room.roomConfig.hostUserID = newHostID;
          room.roomConfig.hostUsername =
            room.players[newHostID]?.username || "";
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
    game.currentRound += 1;

    // pick the first present human player to start the next round
    const playerIDsPresentlyInRoom = Object.keys(room.players).filter(
      (playerID) =>
        !game?.playerIDsThatLeftMidgame.includes(playerID) &&
        !room.players[playerID]?.botDifficulty
    );

    if (playerIDsPresentlyInRoom.length === 0) return;

    io.in(roomCode).emit("startNewRound", {
      roomCode: roomCode,
      gameData: game,
      playerIDToStartNextRound: playerIDsPresentlyInRoom[0],
    });
  }

  socket.on("resetGame", resetGame);
}
