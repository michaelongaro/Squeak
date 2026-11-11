import type { PlayerSocket as Socket } from "~/types/socket";
import { scheduleRoundTask } from "../helpers/scheduleRoundTask";
import { type Server } from "socket.io";
import {
  type IMiscRoomData,
  type IGameData,
  type IRoomData,
  type IPlayerCardsMetadata,
} from "~/types/socket";
import { prisma } from "~/server/db";
import { recordAnalytics } from "~/server/analytics";
import { drawInitialSqueakStackCardFromDeck } from "../helpers/drawInitialSqueakStackCardFromDeck";
import { botMoveHandler } from "./botMoveHandler";
import generateDeckAndSqueakCards from "../../../utils/generateDeckAndSqueakCards";

const botDifficultyDelay = {
  Easy: 9000,
  Medium: 7000,
  Hard: 4500,
  Expert: 3000,
};

export function startGameHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData,
  gameData: IGameData,
  miscRoomData: IMiscRoomData,
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
      const room = roomData[roomCode];
      const players = roomData[roomCode]?.players;

      if (!room || !players) return;
      if (
        !socket.rooms.has(roomCode) ||
        socket.data.playerID !== room.roomConfig.hostUserID
      )
        return;

      const misc = miscRoomData[roomCode];
      if (
        !misc ||
        misc.roundStarted ||
        (firstRound && room.roomConfig.gameStarted)
      )
        return;
      if (!firstRound && !gameData[roomCode]?.players) return;
      misc.roundStarted = true;

      if (firstRound) {
        const board = Array.from({ length: 4 }, () =>
          Array.from({ length: 5 }, () => null),
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

        room.roomConfig.gameStarted = true;
      }

      void recordAnalytics({
        gamesStarted: firstRound ? 1 : 0,
        roundsStarted: 1,
      });

      const currentRoomPlayers = roomData[roomCode]?.players;
      if (!currentRoomPlayers) return;

      scheduleRoundTask(
        gameData,
        roomCode,
        () => {
          for (const [index, playerID] of Object.keys(
            currentRoomPlayers,
          ).entries()) {
            scheduleRoundTask(
              gameData,
              roomCode,
              () => {
                drawInitialSqueakStackCardFromDeck({
                  indexToDrawTo: 0,
                  playerID,
                  roomCode,
                  gameData,
                  io,
                });
              },
              1500 + index * 400,
            );

            scheduleRoundTask(
              gameData,
              roomCode,
              () => {
                drawInitialSqueakStackCardFromDeck({
                  indexToDrawTo: 1,
                  playerID,
                  roomCode,
                  gameData,
                  io,
                });
              },
              2000 + index * 400,
            );

            scheduleRoundTask(
              gameData,
              roomCode,
              () => {
                drawInitialSqueakStackCardFromDeck({
                  indexToDrawTo: 2,
                  playerID,
                  roomCode,
                  gameData,
                  io,
                });
              },
              2500 + index * 400,
            );

            scheduleRoundTask(
              gameData,
              roomCode,
              () => {
                drawInitialSqueakStackCardFromDeck({
                  indexToDrawTo: 3,
                  playerID,
                  roomCode,
                  gameData,
                  io,
                });
              },
              3000 + index * 400,
            );
          }
        },
        firstRound ? 1500 : 0,
      ); // allows for page to be fully* loaded when first navigating to play screen

      const miscRoomDataObj = miscRoomData[roomCode];

      if (!miscRoomDataObj) return;

      scheduleRoundTask(
        gameData,
        roomCode,
        () => {
          for (const [index, playerID] of Object.keys(
            currentRoomPlayers,
          ).entries()) {
            const player = currentRoomPlayers[playerID || ""];
            const botDifficulty = player?.botDifficulty;

            if (!player || !playerID || botDifficulty === undefined) continue;

            let botInterval: NodeJS.Timeout | null = null;
            scheduleRoundTask(
              gameData,
              roomCode,
              () => {
                if (miscRoomDataObj.preventOtherPlayersFromSqueaking) return;
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
                      playerID,
                    ),
                  botDifficultyDelay[botDifficulty] +
                    (Math.floor(Math.random() * 1000) - 500), // random offset by +- 500ms to make bot moves less predictable
                );

                if (botInterval) miscRoomDataObj.botIntervals.push(botInterval);
              },
              1500 * index,
            ); // TODO: still test out better variations with delay..
          }
        },
        3500,
      ); // roughly the time it takes for the cards to be dealt to the players on client side, including
      // the extra delay from inner setTimeout above

      if (firstRound && prisma) {
        io.in(roomCode).emit("navigateToPlayScreen", {
          gameData: gameData[roomCode],
          roomConfig: roomData[roomCode]?.roomConfig,
        });

        await prisma.room.update({
          where: {
            code: roomCode,
          },
          data: {
            gameStarted: true,
          },
        });
      }
    },
  );
}
