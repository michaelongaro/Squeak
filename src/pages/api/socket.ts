import type { PlayerSocket as Socket } from "~/types/socket";
import { Server } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import type { Socket as NetSocket } from "node:net";
import type { NextApiRequest, NextApiResponse } from "next";
import { socketState } from "~/server/socket/state";
import { drawFromDeckHandler } from "~/server/socket/handlers/drawFromDeckHandler";
import { proposedCardDropHandler } from "~/server/socket/handlers/proposedCardDropHandler";
import { roundOverHandler } from "~/server/socket/handlers/roundOverHandler";
import { resetGameHandler } from "~/server/socket/handlers/resetGameHandler";
import { leaveRoomHandler } from "~/server/socket/handlers/leaveRoomHandler";
import { initializePlayerInFriendsObjectHandler } from "~/server/socket/handlers/initializePlayerInFriendsObjectHandler";
import { modifyFriendDataHandler } from "~/server/socket/handlers/modifyFriendDataHandler";
import { updateRoomConfigHandler } from "~/server/socket/handlers/updateRoomConfigHandler";
import { startGameHandler } from "~/server/socket/handlers/startGameHandler";
import { createRoomHandler } from "~/server/socket/handlers/createRoomHandler";
import { joinRoomHandler } from "~/server/socket/handlers/joinRoomHandler";
import { updatePlayerMetadataHandler } from "~/server/socket/handlers/updatePlayerMetadataHandler";
import { castVoteHandler } from "~/server/socket/handlers/castVoteHandler";
import { rejoinRoomHandler } from "~/server/socket/handlers/rejoinRoomHandler";
import { broadcastRoomActionCountdownHandler } from "~/server/socket/handlers/broadcastRoomActionCountdownHandler";
import { gracefulReconnectHandler } from "~/server/socket/handlers/gracefulReconnectHandler";
import { goOfflineHandler } from "~/server/socket/handlers/goOfflineHandler";

const { roomData, gameData, friendsData, miscRoomData } = socketState;

// unsure of if this is necessary
export const config = {
  api: {
    externalResolver: true,
  },
};

export default function SocketHandler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const server = (
    res.socket as (NetSocket & { server: HTTPServer & { io?: Server } }) | null
  )?.server;
  if (!server) {
    res.status(503).end();
    return;
  }
  // means that socket server was already initialized
  if (server.io) {
    res.end();
    return;
  }

  const io = new Server(server, {
    path: "/api/socket",
  });
  server.io = io;

  const onConnection = (socket: Socket) => {
    // pregame/room handlers
    gracefulReconnectHandler(io, socket, roomData, gameData);

    createRoomHandler(io, socket, roomData, miscRoomData);

    joinRoomHandler(io, socket, roomData);

    updateRoomConfigHandler(io, socket, roomData);

    updatePlayerMetadataHandler(io, socket, roomData);

    broadcastRoomActionCountdownHandler(io, socket);

    startGameHandler(io, socket, roomData, gameData, miscRoomData);

    // game/room handlers
    drawFromDeckHandler(io, socket, gameData, miscRoomData);

    proposedCardDropHandler(io, socket, gameData, miscRoomData);

    roundOverHandler(io, socket, gameData, roomData, miscRoomData);

    resetGameHandler(io, socket, gameData, roomData, miscRoomData);

    leaveRoomHandler(io, socket, gameData, roomData, miscRoomData);

    castVoteHandler(io, socket, gameData, miscRoomData, roomData);

    rejoinRoomHandler(io, socket, gameData, roomData, miscRoomData);

    socket.on("directlyLeaveRoom", (roomCode: string) => {
      void socket.leave(roomCode);
    });

    socket.on(
      "measurePlayerPing",
      (_: unknown, ack?: (timestamp: number) => void) => {
        if (typeof ack === "function") ack(Date.now());
      },
    );

    // friends handlers
    initializePlayerInFriendsObjectHandler(io, socket, friendsData);

    modifyFriendDataHandler(io, socket, friendsData);

    goOfflineHandler(io, socket, friendsData);
  };

  io.on("connection", onConnection);

  res.end();
}
