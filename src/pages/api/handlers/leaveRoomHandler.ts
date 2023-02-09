import { type Server, type Socket } from "socket.io";
import {
  type IPlayerHasLeftRoom,
  type IGameData,
  type IGameMetadata,
  type IRoomData,
} from "../socket";

interface ILeaveRoomHandler {
  playerID: string;
  roomCode: string;
}

export function leaveRoomHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData
) {
  function resetGame({ playerID, roomCode }: ILeaveRoomHandler) {
    const game = gameData[roomCode];
    const room = roomData[roomCode];
    const previousHostID = room?.roomConfig.hostUserID;
    let newHostID = "";

    if (!room) return;

    if (!game) {
      // remove player from room
      delete room.players[playerID];
      room.roomConfig.playersInRoom--;
      room.roomConfig.hostUserID = Object.keys(room.players)[0] || "";
      room.roomConfig.hostUsername =
        Object.values(room.players)[0]?.username || "";
    }

    if (game) {
      // remove player from game
      game.playerIDsThatLeftMidgame.push(playerID);
    }

    const earliestJoinedPlayerInRoom = Object.keys(room.players)[0];

    // assign a new host if the host left
    if (
      playerID === previousHostID &&
      room.roomConfig.playersInRoom !== 0 &&
      earliestJoinedPlayerInRoom
    ) {
      newHostID = earliestJoinedPlayerInRoom;
    }

    // if there are no players left in the room, delete the room
    if (room.roomConfig.playersInRoom === 0) {
      delete roomData[roomCode];
      delete gameData[roomCode];
    }

    // leaving before emitting so that player who left doesn't receive the event
    // primarily just to update players who are still in the room when this happens
    socket.leave(roomCode);

    const emitData: IPlayerHasLeftRoom = {
      roomConfig: room.roomConfig,
      players: room.players,
      gameData: game ?? ({} as IGameMetadata),
      newHostID,
    };

    io.in(roomCode).emit("playerHasLeftRoom", emitData);
  }

  socket.on("leaveRoom", resetGame);
}
