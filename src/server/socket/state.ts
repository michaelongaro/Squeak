import type {
  IFriendsData,
  IGameData,
  IMiscRoomData,
  IRoomData,
} from "~/types/socket";

// Separately bundled API routes and development reloads share the data owned
// by the already-running Socket.IO server.
const globalState = globalThis as typeof globalThis & {
  squeakSocketState?: {
    roomData: IRoomData;
    gameData: IGameData;
    friendsData: IFriendsData;
    miscRoomData: IMiscRoomData;
  };
};

export const socketState = (globalState.squeakSocketState ??= {
  roomData: {},
  gameData: {},
  friendsData: {},
  miscRoomData: {},
});

export function removeRoomState(code: string) {
  for (const interval of socketState.miscRoomData[code]?.botIntervals ?? []) {
    clearInterval(interval);
  }
  delete socketState.roomData[code];
  delete socketState.gameData[code];
  delete socketState.miscRoomData[code];
}
