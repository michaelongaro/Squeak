import { type Server, type Socket } from "socket.io";
import {
  type IMiscRoomData,
  type IGameData,
  type IRoomData,
  type IPlayerCardsMetadata,
} from "../socket";
import { PrismaClient } from "@prisma/client";
import { drawFromSqueakDeck } from "../helpers/drawFromSqueakDeck";
import { gameStuckHandler } from "./gameStuckHandler";
import { botMoveHandler } from "./botMoveHandler";
import generateDeckAndSqueakCards from "../../../utils/generateDeckAndSqueakCards";

const prisma = new PrismaClient();

const botDifficultyDelay = {
  Easy: 5000,
  Medium: 3000,
  Hard: 1000,
};

export function startGameHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData,
  gameData: IGameData,
  miscRoomData: IMiscRoomData
) {
  socket.on(
    "startGame",
    async ({
      roomCode,
      firstRound,
    }: {
      roomCode: string;
      firstRound: boolean;
    }) => {
      const players = roomData[roomCode]?.players;

      if (!players) return;

      const board = Array.from({ length: 4 }, () =>
        Array.from({ length: 5 }, () => null)
      );

      const playerCards: IPlayerCardsMetadata = {};
      // loop through players and create + get their cards
      for (const playerID of Object.keys(players)) {
        playerCards[playerID] = {
          ...generateDeckAndSqueakCards(),
          totalPoints: 0,
          rankInRoom: -1,
        };
      }

      gameData[roomCode] = {
        board,
        players: playerCards,
        currentRound: 1,
        playerIDsThatLeftMidgame: [],
      };

      // loop through all players and flip their squeak deck cards locally
      // (I tried to do this with traditional client/server communication, but
      // relying on the timeouts to be in sync was too unreliable, so locally dealing cards
      // on the server here, and each client locally does the same on their end)
      const currentRoomPlayers = roomData[roomCode]?.players;
      if (!currentRoomPlayers) return;

      // start interval that checks + handles if game is stuck
      // (no player has a valid move available)
      const miscRoomDataObj = miscRoomData[roomCode];

      if (!miscRoomDataObj) return;

      setTimeout(() => {
        miscRoomDataObj.gameStuckInterval = setInterval(() => {
          gameStuckHandler(io, roomCode, gameData, miscRoomData);
        }, 15000);

        for (const index in Object.keys(currentRoomPlayers)) {
          const playerID = Object.keys(currentRoomPlayers)[parseInt(index)];
          const player = currentRoomPlayers[playerID || ""];

          console.log(player, playerID, player?.botDifficulty);

          if (!player || !playerID || player.botDifficulty === undefined)
            continue;

          console.log("setting interval for", playerID);

          const botInterval = setInterval(
            () =>
              botMoveHandler(
                io,
                roomCode,
                gameData,
                roomData,
                miscRoomData,
                playerID
              ),
            botDifficultyDelay[player.botDifficulty]
          );

          if (!miscRoomDataObj.botIntervals) {
            miscRoomDataObj.botIntervals = [botInterval];
          } else {
            miscRoomDataObj.botIntervals.push(botInterval);
          }
        }
      }, 7500); // roughly the time it takes for the cards to be dealt to the players on client side

      if (firstRound && prisma) {
        io.in(roomCode).emit("navigateToPlayScreen", gameData[roomCode]);

        for (const index in Object.keys(currentRoomPlayers)) {
          const playerID = Object.keys(currentRoomPlayers)[parseInt(index)];
          if (playerID === undefined) return;

          // setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 0,
            playerID,
            roomCode,
            gameData,
            io,
            preventEmit: true,
          });
          // }, 1500 + parseInt(index) * 400);

          // setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 1,
            playerID,
            roomCode,
            gameData,
            io,
            preventEmit: true,
          });
          // }, 2000 + parseInt(index) * 400);

          // setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 2,
            playerID,
            roomCode,
            gameData,
            io,
            preventEmit: true,
          });
          // }, 2500 + parseInt(index) * 400);

          // setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 3,
            playerID,
            roomCode,
            gameData,
            io,
            preventEmit: true,
          });
          // }, 3000 + parseInt(index) * 400);
        }

        await prisma.room.update({
          where: {
            code: roomCode,
          },
          data: {
            gameStarted: true,
          },
        });
      }
    }
  );
}
