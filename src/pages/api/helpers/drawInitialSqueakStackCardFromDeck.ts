import { type Server } from "socket.io";
import { type IGameData } from "../socket";

interface IInitDrawFromSqueakDeck {
  roomCode: string;
  indexToDrawTo: number;
  playerID: string;
  gameData: IGameData;
  io: Server;
}

export function drawInitialSqueakStackCardFromDeck({
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

  const card = player.deck.pop();

  if (card) {
    player.squeakHand?.[indexToDrawTo]?.push(card);

    io.in(roomCode).emit("initialCardDrawnForSqueakStack", {
      playerID,
      indexToDrawTo,
      newCard: card,
      updatedPlayerCards: player,
    });
  }
}
