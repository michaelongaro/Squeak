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
      // safe to directly delete player if game hasn't started yet
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

    // TODO: can probably simply these two if statements into an if/else, but check side effects

    function justBotPlayersLeft() {
      if (!game) return false;

      for (const playerID in room?.players) {
        if (
          room.players[playerID]?.botDifficulty === undefined &&
          !game.playerIDsThatLeftMidgame.includes(playerID)
        )
          return false;
      }
      return true;
    }

    // assign a new host if the host left (and there are not just bots left in the room)
    if (
      playerID === previousHostID &&
      room.roomConfig.playersInRoom !== 0 &&
      !justBotPlayersLeft()
    ) {
      // loop over all of the players in the room and find the first one that isn't a bot
      for (const playerID in room.players) {
        const playerHasLeftGame = game
          ? game.playerIDsThatLeftMidgame.includes(playerID)
          : false;

        // don't we also have to do the check for playerIDsThatLeftMidgame here?
        if (
          room.players[playerID]?.botDifficulty === undefined &&
          !playerHasLeftGame
        ) {
          newHostID = playerID;
          break;
        }
      }

      room.roomConfig.hostUserID = newHostID;
      room.roomConfig.hostUsername = room.players[newHostID]?.username || "";
    }

    // if there are no players left in the room, delete the room
    if (room.roomConfig.playersInRoom === 0 || justBotPlayersLeft()) {
      delete roomData[roomCode];
      delete gameData[roomCode];

      if (miscRoomDataObj) {
        clearInterval(miscRoomDataObj.gameStuckInterval);

        // clear any bot intervals
        for (const botInterval of miscRoomDataObj.botIntervals || []) {
          clearInterval(botInterval);
        }

        delete miscRoomData[roomCode];
      }
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

    // prisma operations are async, so this needs to be called after the emit
    // to reduce on delay on the client side
    if (room.roomConfig.playersInRoom === 0) {
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
  }

  socket.on("leaveRoom", resetGame);
}
