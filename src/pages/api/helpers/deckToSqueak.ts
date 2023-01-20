import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../socket";

interface IDeckToSqueak {
  gameData: IGameData;
  card: ICard;
  playerID: string;
  roomCode: string;
  io: Server;
  squeakEndLocation: number;
}

export function deckToSqueak({
  gameData,
  card,
  squeakEndLocation,
  playerID,
  roomCode,
  io,
}: IDeckToSqueak) {
  const player = gameData[roomCode]?.players?.[playerID];
  const squeakStackLocation =
    gameData[roomCode]?.players?.[playerID]?.squeakHand[squeakEndLocation];

  if (!player || !squeakStackLocation) return;

  squeakStackLocation.push(card);

  player.topCardsInDeck.pop();
  player.topCardsInDeck.unshift(null);

  player.deck = player.deck.filter((c) => {
    if (c.value === card.value && c.suit === card.suit) {
      player.deckIdx--;
      return false;
    }

    return true;
  });

  io.in(roomCode).emit("cardDropApproved", {
    card,
    endID: `${playerID}squeakHand${squeakEndLocation}`,
    updatedBoard: gameData[roomCode]?.board, // ideally shouldn't have to send this
    updatedPlayerCards: gameData[roomCode]?.players,
    playerID,
  });
}
