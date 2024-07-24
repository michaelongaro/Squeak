import { type Server, type Socket } from "socket.io";
import { type IGameData } from "../socket";
import { type IQueuedCard } from "~/context/RoomContext";
import isEqual from "lodash.isequal";

interface IValidateClientServerSync {
  playerID: string;
  roomCode: string;
  clientGameData: IGameData;
  clientQueuedCards: IQueuedCard;
}

export function validateClientServerSyncHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
) {
  function validateClientServerSync({
    playerID,
    roomCode,
    clientGameData,
  }: IValidateClientServerSync) {
    const game = gameData[roomCode];

    if (!game) return;

    if (!isEqual(clientGameData, game)) {
      console.log("mismatch detected");

      // if the card is not found in the queued cards, emit a "syncClientWithServer" emit with the current gameData[roomCode]
      io.in(roomCode).emit("syncClientWithServer", game);
      return;
    }
  }

  socket.on(
    "checkClientSyncWithServer",
    ({
      playerID,
      roomCode,
      clientGameData,
      clientQueuedCards,
    }: {
      playerID: string;
      roomCode: string;
      clientGameData: IGameData;
      clientQueuedCards: IQueuedCard;
    }) =>
      validateClientServerSync({
        playerID,
        roomCode,
        clientGameData,
        clientQueuedCards,
      }),
  );
}
