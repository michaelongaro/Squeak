import { type Server, type Socket } from "socket.io";
import {
  type IMiscRoomData,
  type IGameData,
  type IRoomData,
  type IPlayerCardsMetadata,
} from "../socket";
import { prisma } from "~/server/db";
import { drawFromSqueakDeck } from "../helpers/drawFromSqueakDeck";
import { botMoveHandler } from "./botMoveHandler";
import generateDeckAndSqueakCards from "../../../utils/generateDeckAndSqueakCards";

const botDifficultyDelay = {
  Easy: 7000,
  Medium: 5000,
  Hard: 3000,
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

      if (firstRound) {
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
      }

      const currentRoomPlayers = roomData[roomCode]?.players;
      if (!currentRoomPlayers) return;

      for (const index in Object.keys(currentRoomPlayers)) {
        const playerID = Object.keys(currentRoomPlayers)[parseInt(index)];
        if (playerID === undefined) return;

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 0,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 1500 + parseInt(index) * 400);

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 1,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 2000 + parseInt(index) * 400);

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 2,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 2500 + parseInt(index) * 400);

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 3,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 3000 + parseInt(index) * 400);
      }

      // start interval that checks + handles if game is stuck
      // (no player has a valid move available)
      const miscRoomDataObj = miscRoomData[roomCode];

      if (!miscRoomDataObj) return;

      setTimeout(() => {
        for (const index in Object.keys(currentRoomPlayers)) {
          const playerID = Object.keys(currentRoomPlayers)[parseInt(index)];
          const player = currentRoomPlayers[playerID || ""];
          const botDifficulty = player?.botDifficulty;

          if (!player || !playerID || botDifficulty === undefined) continue;

          let botInterval: NodeJS.Timeout | null = null;
          setTimeout(() => {
            // TODO: could probably move this directly to happen when bot joins a room in joinHandler.ts
            if (
              miscRoomDataObj.blacklistedSqueakCards[playerID] === undefined
            ) {
              miscRoomDataObj.blacklistedSqueakCards[playerID] = {};
            }

            botInterval = setInterval(
              () =>
                botMoveHandler(
                  io,
                  roomCode,
                  gameData,
                  roomData,
                  miscRoomData,
                  playerID
                ),
              botDifficultyDelay[botDifficulty] +
                (Math.floor(Math.random() * 1000) - 500) // random offset by +- 500ms
            );

            if (botInterval) miscRoomDataObj.botIntervals.push(botInterval);
          }, 1500 * parseInt(index)); // TODO: still test out better variations with delay..
        }
      }, 7000); // roughly the time it takes for the cards to be dealt to the players on client side

      if (firstRound && prisma) {
        io.in(roomCode).emit("navigateToPlayScreen", gameData[roomCode]);

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
