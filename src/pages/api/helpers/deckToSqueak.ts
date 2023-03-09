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
  const board = gameData[roomCode]?.board;
  const players = gameData[roomCode]?.players;
  const player = gameData[roomCode]?.players?.[playerID];

  const squeakStackLocation =
    gameData[roomCode]?.players?.[playerID]?.squeakHand[squeakEndLocation];

  if (!player || !board || !players || !squeakStackLocation) return;

  squeakStackLocation.push(card);

  player.topCardsInDeck.pop();
  player.topCardsInDeck.unshift(null);

  player.deck = player.deck.filter((c) => {
    if (c.value === card.value && c.suit === card.suit) {
      return false;
    }

    return true;
  });

  const indexWithinSqueakStack = gameData[roomCode]!.players[
    playerID
  ]!.squeakHand[squeakEndLocation]!.findIndex(
    (squeakCard) =>
      squeakCard.value === card.value && squeakCard.suit === card.suit
  );

  const squeakStackLength =
    gameData[roomCode]!.players[playerID]!.squeakHand[squeakEndLocation]!
      .length;

  io.in(roomCode).emit("cardDropApproved", {
    card,
    squeakEndCoords: {
      offsetHeight: indexWithinSqueakStack * (20 - squeakStackLength),
    },
    endID: `${playerID}squeakHand${squeakEndLocation}`,
    updatedBoard: board,
    updatedPlayerCards: players,
    playerID,
  });
}
