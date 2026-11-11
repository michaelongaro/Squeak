import type { PlayerSocket as Socket } from "~/types/socket";
import type { Server } from "socket.io";
import type { IGameData, IRoomData } from "~/types/socket";

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
        socket.data.playerID = userID;
        void socket.join(roomCode);
        socket.emit("currentRoomMetadata", {
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
