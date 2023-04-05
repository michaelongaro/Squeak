import { type Server, type Socket } from "socket.io";
import { type IRoomData, type IMiscRoomData } from "../socket";

export function playerFullyReadyHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData
) {
  socket.on("playerFullyReady", (roomCode) => {
    const miscRoomDataObj = miscRoomData[roomCode];

    if (!miscRoomDataObj) return;
    miscRoomDataObj.numberOfPlayersReady++;

    const room = roomData[roomCode];

    if (
      room &&
      miscRoomDataObj.numberOfPlayersReady === Object.keys(room.players).length
    ) {
      room.roomConfig.gameStarted = true;
      io.in(roomCode).emit("roomConfigUpdated", room.roomConfig);
      io.in(roomCode).emit("gameStarted");
      miscRoomDataObj.numberOfPlayersReady = 0;
    }
  });
}
