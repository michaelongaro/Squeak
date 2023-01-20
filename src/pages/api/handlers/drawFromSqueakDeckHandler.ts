import { type Server, type Socket } from "socket.io";
import { type IGameData, type IDrawFromSqueakDeck } from "../socket";

export function drawFromSqueakDeckHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData
) {
  function drawFromSqueakDeck({
    indexToDrawTo,
    playerID,
    roomCode,
  }: IDrawFromSqueakDeck) {
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

  socket.on("drawFromSqueakDeck", drawFromSqueakDeck);
}
