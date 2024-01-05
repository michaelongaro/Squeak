import { type Server } from "socket.io";
import { type IGameData } from "../socket";

interface IInitDrawFromSqueakDeck {
  roomCode: string;
  indexToDrawTo: number;
  playerID: string;
  gameData: IGameData;
  io: Server;
  preventEmit?: boolean;
}

export function drawFromSqueakDeck({
  roomCode,
  indexToDrawTo,
  playerID,
  gameData,
  io,
  preventEmit,
}: IInitDrawFromSqueakDeck) {
  const board = gameData[roomCode]?.board;
  const players = gameData[roomCode]?.players;
  const player = gameData[roomCode]?.players?.[playerID];
  if (!board || !players || !player) return;

  const card = player.squeakDeck.pop();
  // shouldn't this 1000% be pop()?
  if (card) {
    player.squeakHand?.[indexToDrawTo]?.push(card);

    if (preventEmit) return;
    io.in(roomCode).emit("cardDrawnFromSqueakDeck", {
      playerID,
      indexToDrawTo,
      newCard: card,
      updatedGameData: gameData[roomCode],
    });
  }
}
