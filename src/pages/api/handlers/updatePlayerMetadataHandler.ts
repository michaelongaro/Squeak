import { type Server, type Socket } from "socket.io";
import { type IRoomData, type IUpdatePlayerMetadata } from "../socket";

export function updatePlayerMetadataHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData
) {
  socket.on(
    "updatePlayerMetadata",
    ({ newPlayerMetadata, playerID, roomCode }: IUpdatePlayerMetadata) => {
      const room = roomData[roomCode];
      const user = roomData[roomCode]?.players[playerID];

      if (!room || !user) return;

      user.avatarPath = newPlayerMetadata.avatarPath;
      user.color = newPlayerMetadata.color;
      user.deckHueRotation = newPlayerMetadata.deckHueRotation;
      user.username = newPlayerMetadata.username;

      io.in(roomCode).emit("playerMetadataUpdated", room.players);
    }
  );
}
