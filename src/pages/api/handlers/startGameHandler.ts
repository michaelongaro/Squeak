import { type Server, type Socket } from "socket.io";
import { type IMiscRoomData, type IGameData, type IRoomData } from "../socket";
import { PrismaClient } from "@prisma/client";
import { drawFromSqueakDeck } from "../helpers/drawFromSqueakDeck";
import { gameStuckHandler } from "./gameStuckHandler";

const prisma = new PrismaClient();

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
      // loop through all players and flip their squeak deck cards
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

      miscRoomDataObj.gameStuckInterval = setInterval(() => {
        gameStuckHandler(io, roomCode, gameData, miscRoomData);
      }, 15000);

      if (firstRound && prisma) {
        io.in(roomCode).emit("navigateToPlayScreen");

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
