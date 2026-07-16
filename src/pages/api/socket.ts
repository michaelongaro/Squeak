import { Server, type Socket } from "socket.io";
import type {
  IFriendsData,
  IGameData,
  IMiscRoomData,
  IRoomData,
} from "~/types/socket";
import { drawFromDeckHandler } from "./handlers/drawFromDeckHandler";
import { proposedCardDropHandler } from "./handlers/proposedCardDropHandler";
import { roundOverHandler } from "./handlers/roundOverHandler";
import { resetGameHandler } from "./handlers/resetGameHandler";
import { leaveRoomHandler } from "./handlers/leaveRoomHandler";
import { initializePlayerInFriendsObjectHandler } from "./handlers/initializePlayerInFriendsObjectHandler";
import { modifyFriendDataHandler } from "./handlers/modifyFriendDataHandler";
import { updateRoomConfigHandler } from "./handlers/updateRoomConfigHandler";
import { startGameHandler } from "./handlers/startGameHandler";
import { createRoomHandler } from "./handlers/createRoomHandler";
import { joinRoomHandler } from "./handlers/joinRoomHandler";
import { updatePlayerMetadataHandler } from "./handlers/updatePlayerMetadataHandler";
import { castVoteHandler } from "./handlers/castVoteHandler";
import { rejoinRoomHandler } from "./handlers/rejoinRoomHandler";
import { oldRoomCleanupCronHandler } from "~/pages/api/handlers/oldRoomCleanupCronHandler";
import { broadcastRoomActionCountdownHandler } from "~/pages/api/handlers/broadcastRoomActionCountdownHandler";
import { gracefulReconnectHandler } from "~/pages/api/handlers/gracefulReconnectHandler";
import { goOfflineHandler } from "~/pages/api/handlers/goOfflineHandler";

const roomData: IRoomData = {};
const gameData: IGameData = {};
const friendsData: IFriendsData = {};
const miscRoomData: IMiscRoomData = {};

// unsure of if this is necessary
export const config = {
  api: {
    externalResolver: true,
  },
};

// @ts-expect-error sdf
export default function SocketHandler(req, res) {
  // means that socket server was already initialized
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: "/api/socket",
  });
  res.socket.server.io = io;

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
    drawFromDeckHandler(io, socket, gameData);

    proposedCardDropHandler(io, socket, gameData, miscRoomData);

    roundOverHandler(io, socket, gameData, roomData, miscRoomData);

    resetGameHandler(io, socket, gameData, roomData, miscRoomData);

    leaveRoomHandler(io, socket, gameData, roomData, miscRoomData);

    castVoteHandler(io, socket, gameData, miscRoomData, roomData);

    rejoinRoomHandler(io, socket, gameData, roomData, miscRoomData);

    oldRoomCleanupCronHandler(io, socket, gameData, roomData, miscRoomData);

    socket.on("directlyLeaveRoom", (roomCode) => {
      socket.leave(roomCode);
    });

    socket.on("measurePlayerPing", (_, ack) => {
      ack(Date.now());
    });

    // friends handlers
    initializePlayerInFriendsObjectHandler(io, socket, friendsData);

    modifyFriendDataHandler(io, socket, friendsData);

    goOfflineHandler(io, socket, friendsData);
  };

  io.on("connection", onConnection);

  res.end();
}
