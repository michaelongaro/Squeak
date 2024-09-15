import { type Server, type Socket } from "socket.io";

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
