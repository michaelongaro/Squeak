import type { PlayerSocket as Socket } from "~/types/socket";
import { type Server } from "socket.io";

interface IBroadcastRoomActionCountdown {
  code: string;
  hostUserID: string;
  type: "startRound" | "returnToRoom";
}

export function broadcastRoomActionCountdownHandler(
  io: Server,
  socket: Socket,
) {
  socket.on(
    "broadcastRoomActionCountdown",
    async ({ hostUserID, code, type }: IBroadcastRoomActionCountdown) => {
      io.in(code).emit(
        type === "startRound" ? "startRoundCountdown" : "returnToRoomCountdown",
        hostUserID,
      );
    },
  );
}
