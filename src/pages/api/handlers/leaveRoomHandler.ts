import { type Server, type Socket } from "socket.io";
import {
  type IPlayerHasLeftRoom,
  type IGameData,
  type IGameMetadata,
  type IRoomData,
  type IMiscRoomData,
} from "../socket";

interface ILeaveRoomHandler {
  playerID: string;
  roomCode: string;
}

export function leaveRoomHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData
) {
  function resetGame({ playerID, roomCode }: ILeaveRoomHandler) {
    const game = gameData[roomCode];
    const room = roomData[roomCode];
    const miscRoomDataObj = miscRoomData[roomCode];
    const previousHostID = room?.roomConfig.hostUserID;
    let newHostID = "";

    if (!room) return;

    // workaround because I couldn't get "leaveRoom" emit to work properly on client
    // without calling it multiple times, this gate keeps it from running more than once
    // per player who called it
    if (!room.players[playerID]) return;

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
    }

    const emitData: IPlayerHasLeftRoom = {
      roomConfig: room.roomConfig,
      players: room.players,
      gameData: game ?? ({} as IGameMetadata),
      playerWhoLeftID: playerID,
      newHostID,
    };

    io.in(roomCode).emit("playerHasLeftRoom", emitData);
  }

  socket.on("leaveRoom", resetGame);
}
