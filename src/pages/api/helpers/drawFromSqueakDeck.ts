import { type Server } from "socket.io";
import { type IGameData } from "../socket";

interface IInitDrawFromSqueakDeck {
  roomCode: string;
  indexToDrawTo: number;
  playerID: string;
  gameData: IGameData;
  io: Server;
}

export function drawFromSqueakDeck({
  roomCode,
  indexToDrawTo,
  playerID,
  gameData,
  io,
}: IInitDrawFromSqueakDeck) {
  const player = gameData[roomCode]?.players?.[playerID];
  if (!player) return;

  const card = player.squeakDeck.shift();
  if (card) {
    player.squeakHand?.[indexToDrawTo]?.push(card);

    io.in(roomCode).emit("cardDrawnFromSqueakDeck", {
      playerID,
      indexToDrawTo,
      newCard: card,
      updatedPlayerCards: player,
    });
  }
}
