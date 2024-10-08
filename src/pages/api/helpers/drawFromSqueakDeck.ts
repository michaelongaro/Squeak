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
  const board = gameData[roomCode]?.board;
  const players = gameData[roomCode]?.players;
  const player = gameData[roomCode]?.players?.[playerID];
  if (!board || !players || !player) return;

  const card = player.squeakDeck.pop();

  if (card) {
    player.squeakHand?.[indexToDrawTo]?.push(card);

    io.in(roomCode).emit("cardDrawnFromSqueakDeck", {
      playerID,
      cardsInInitialPile: player.squeakDeck.length,
      cardsInTargetPile: 0,
      indexToDrawTo,
      newCard: card,
      gameData: gameData[roomCode],
    });
  }
}
