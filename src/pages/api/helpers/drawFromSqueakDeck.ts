import { type Server } from "socket.io";
import { type IDrawFromSqueakDeck, type IGameData } from "../socket";

interface IInitDrawFromSqueakDeck extends IDrawFromSqueakDeck {
  gameData: IGameData;
  io: Server;
}

export function drawFromSqueakDeck({
  indexToDrawTo,
  playerID,
  roomCode,
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
      updatedBoard: gameData[roomCode]?.board,
      updatedPlayerCards: gameData[roomCode]?.players,
    });
  }
}
