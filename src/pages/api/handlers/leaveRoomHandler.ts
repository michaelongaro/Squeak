import { type Server, type Socket } from "socket.io";
import {
  type IPlayerHasLeftRoom,
  type IGameData,
  type IGameMetadata,
  type IRoomData,
  type IMiscRoomData,
} from "../socket";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ILeaveRoomHandler {
  playerID: string;
  roomCode: string;
  playerWasKicked: boolean;
}

export function leaveRoomHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData
) {
  async function resetGame({
    playerID,
    roomCode,
    playerWasKicked,
  }: ILeaveRoomHandler) {
    const game = gameData[roomCode];
    const room = roomData[roomCode];
    const miscRoomDataObj = miscRoomData[roomCode];
    const previousHostID = room?.roomConfig.hostUserID;
    let newHostID = "";

    if (!room || !prisma) return;

    // workaround because I couldn't get "leaveRoom" emit to work properly on client
    // without calling it multiple times, this gate keeps it from running more than once
    // per player who called it
    if (!room.players[playerID]) return;

    if (!game) {
      // remove player from room, while keeping user metadata to still show for
      // their icon
      delete room.players[playerID];
    }

    // testing this outside to make sure room still gets deleted if no other players
    // are in the room
    room.roomConfig.playersInRoom--;

    if (game) {
      // extra precaution to make sure playerID isn't added to array more than once
      if (game.playerIDsThatLeftMidgame.includes(playerID)) return;
      game.playerIDsThatLeftMidgame.push(playerID);
    }

    // assign a new host if the host left
    if (playerID === previousHostID && room.roomConfig.playersInRoom !== 0) {
      room.roomConfig.hostUserID = Object.keys(room.players)[0] || "";
      room.roomConfig.hostUsername =
        Object.values(room.players)[0]?.username || "";
      const earliestJoinedPlayerIDInRoom = Object.keys(room.players)[0];
      if (earliestJoinedPlayerIDInRoom) {
        newHostID = earliestJoinedPlayerIDInRoom;
      }
    }

    // if there are no players left in the room, delete the room
    if (room.roomConfig.playersInRoom === 0) {
      delete roomData[roomCode];
      delete gameData[roomCode];

      if (miscRoomDataObj) {
        clearInterval(miscRoomDataObj.gameStuckInterval);
        delete miscRoomData[roomCode];
      }

      await prisma.room.delete({
        where: {
          code: roomCode,
        },
      });
    } else {
      // if there are still players in the room, update the room in the database

      await prisma.room.update({
        where: {
          code: roomCode,
        },
        data: {
          playersInRoom: room.roomConfig.playersInRoom,
          hostUserID: room.roomConfig.hostUserID,
          hostUsername: room.roomConfig.hostUsername,
        },
      });
    }

    const emitData: IPlayerHasLeftRoom = {
      roomConfig: room.roomConfig,
      players: room.players,
      gameData: game ?? ({} as IGameMetadata),
      playerWhoLeftID: playerID,
      newHostID,
      playerWasKicked,
    };

    io.in(roomCode).emit("playerHasLeftRoom", emitData);
  }

  socket.on("leaveRoom", resetGame);
}
