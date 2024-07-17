import { type Server, type Socket } from "socket.io";
import {
  type IPlayerHasLeftRoom,
  type IGameData,
  type IGameMetadata,
  type IRoomData,
  type IMiscRoomData,
} from "../socket";
import { prisma } from "~/server/db";
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
  socket.on(
    "leaveRoom",
    ({ playerID, roomCode, playerWasKicked }: ILeaveRoomHandler) =>
      leaveRoom({
        io,
        socket,
        gameData,
        roomData,
        miscRoomData,
        roomCode,
        playerID,
        playerWasKicked,
      })
  );
}

interface ILeaveRoomBackend {
  io: Server;
  socket: Socket;
  gameData: IGameData;
  roomData: IRoomData;
  miscRoomData: IMiscRoomData;
  roomCode: string;
  playerID: string;
  playerWasKicked: boolean;
}

export async function leaveRoom({
  io,
  socket,
  gameData,
  roomData,
  miscRoomData,
  roomCode,
  playerID,
  playerWasKicked,
}: ILeaveRoomBackend) {
  const game = gameData[roomCode];
  const room = roomData[roomCode];
  const miscRoomDataObj = miscRoomData[roomCode];
  const previousHostID = room?.roomConfig.hostUserID;
  let newHostID = "";

  if (!room || !prisma) return;

  // workaround because I couldn't get "leaveRoom" emit to work properly on client
  // without calling it multiple times, this gate keeps it from running more than once
  // per player who called it
  if (room.players[playerID] === undefined) return;
  // ^^^^ is this returning early somehow?

  if (!room.roomConfig.gameStarted) {
    // safe to directly delete player if game hasn't started yet
    delete room.players[playerID];
  }

  // testing this outside to make sure room still gets deleted if no other players
  // are in the room
  room.roomConfig.playersInRoom--;

  room.roomConfig.playerIDsInRoom = room.roomConfig.playerIDsInRoom.filter(
    (id) => id !== playerID
  );

  // extra precaution to make sure playerID isn't added to array more than once
  if (
    room.roomConfig.gameStarted &&
    game?.playerIDsThatLeftMidgame &&
    game.playerIDsThatLeftMidgame.includes(playerID) === false
  ) {
    game.playerIDsThatLeftMidgame.push(playerID);
  }

  const playerIDsThatLeftMidgame =
    room.roomConfig.gameStarted && game ? game.playerIDsThatLeftMidgame : [];

  const playerIDsPresentlyInRoom = Object.keys(room.players).filter(
    (playerID) =>
      playerIDsThatLeftMidgame.includes(playerID) === false &&
      room.players[playerID]?.botDifficulty === undefined
  );

  // assign a new host (if available) if the host left
  if (playerID === previousHostID && playerIDsPresentlyInRoom.length > 0) {
    newHostID = playerIDsPresentlyInRoom[0] as string; // we know this will exist and be a string

    room.roomConfig.hostUserID = newHostID;
    room.roomConfig.hostUsername = room.players[newHostID]?.username || "";
  }

  // if there are no players left in the room, delete the room
  if (playerIDsPresentlyInRoom.length === 0) {
    delete roomData[roomCode];
    delete gameData[roomCode];

    if (miscRoomDataObj) {
      // clear any bot intervals
      for (const botInterval of miscRoomDataObj.botIntervals) {
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

  // we are using the same handler for leaving a room regularly and
  // kicking another player, so we need to make this distinction so we
  // don't leave the room when trying to kick another player
  if (!playerWasKicked) socket.leave(roomCode);

  // prisma operations are async, so this needs to be called after the emit
  // to reduce on delay on the client side
  if (playerIDsPresentlyInRoom.length === 0) {
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
        playerIDsInRoom: Object.keys(room.players),
      },
    });
  }
}
