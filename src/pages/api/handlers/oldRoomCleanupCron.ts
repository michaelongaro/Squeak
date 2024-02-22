import { type Server, type Socket } from "socket.io";
import { type IGameData, type IRoomData, type IMiscRoomData } from "../socket";
import { leaveRoom } from "~/pages/api/handlers/leaveRoomHandler";
import { prisma } from "~/server/db";

interface IOldRoomCleanupCron {
  code: string;
}

export function oldRoomCleanupCron(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData
) {
  socket.on("oldRoomCleanupCron", async ({ code }: IOldRoomCleanupCron) => {
    const room = roomData[code];
    const players = roomData[code]?.players;

    if (!room || !players) {
      await prisma.room.delete({
        where: {
          code: code,
        },
      });

      return;
    }

    const humanPlayerIDsInRoom = Object.keys(players).filter(
      (playerID) => players[playerID]?.botDifficulty === undefined
    );

    if (humanPlayerIDsInRoom.length === 0) {
      // if no human players in room, delete room
      delete roomData[code];
      delete gameData[code];
    }

    // otherwise, make each human player leave the room
    let delay = 5000;
    for (const playerID of humanPlayerIDsInRoom) {
      setTimeout(() => {
        leaveRoom({
          io,
          socket,
          gameData,
          roomData,
          miscRoomData,
          roomCode: code,
          playerID,
          playerWasKicked: true,
        });
      }, delay);
      delay += 5000;
    }
    // TODO: not the biggest fan of this delay setup, but should be semi-okay for now
    // honestly not sure if it's even needed, just didn't want to spam database with
    // too many operations at once
  });
}
