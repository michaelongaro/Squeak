import type { Server, Socket } from "socket.io";
import type { IGameData, IRoomData } from "~/pages/api/socket";

export function gracefulReconnectHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData,
  gameData: IGameData,
) {
  socket.on(
    "attemptToGracefullyReconnectToRoom",
    async ({ roomCode, userID }: { roomCode: string; userID: string }) => {
      // checking if the room exists and the user is in the room
      if (roomData[roomCode] && roomData[roomCode].players[userID]) {
        socket.join(roomCode);
        io.in(roomCode).emit("currentRoomMetadata", {
          roomConfig: roomData[roomCode].roomConfig,
          playerMetadata: roomData[roomCode].players,
          gameData: gameData[roomCode] === undefined ? {} : gameData[roomCode],
        });
      } else {
        io.emit("redirectToHomepage", userID);
      }
    },
  );
}
