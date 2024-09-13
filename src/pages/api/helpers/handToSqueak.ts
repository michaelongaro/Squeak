import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../socket";

interface IDeckToSqueak {
  gameData: IGameData;
  card: ICard;
  playerID: string;
  roomCode: string;
  io: Server;
  squeakStackEndIndex: number;
}

export function handToSqueak({
  gameData,
  card,
  squeakStackEndIndex,
  playerID,
  roomCode,
  io,
}: IDeckToSqueak) {
  const board = gameData[roomCode]?.board;
  const players = gameData[roomCode]?.players;
  const player = gameData[roomCode]?.players?.[playerID];

  const squeakStackLocation =
    gameData[roomCode]?.players?.[playerID]?.squeakHand[squeakStackEndIndex];

  if (!player || !board || !players || !squeakStackLocation) return;

  squeakStackLocation.push(card);

  player.hand.pop();

  player.deck = player.deck.filter((c) => {
    if (c.value === card.value && c.suit === card.suit) {
      return false;
    }

    return true;
  });

  const indexWithinTargetSqueakStack = gameData[roomCode]!.players[
    playerID
  ]!.squeakHand[squeakStackEndIndex]!.findIndex(
    (squeakCard) =>
      squeakCard.value === card.value && squeakCard.suit === card.suit,
  );

  const targetSqueakStackLength =
    gameData[roomCode]!.players[playerID]!.squeakHand[squeakStackEndIndex]!
      .length;

  io.in(roomCode).emit("cardDropApproved", {
    card,
    ardsInInitialPile: player.hand.length,
    cardsInTargetPile: 0,
    startingCardMetadata: {
      originSqueakStackIdx: undefined,
      destinationSqueakStackIdx: squeakStackEndIndex,
      lengthOfStartStack: 1,
    },
    squeakEndCoords: {
      offsetHeight:
        indexWithinTargetSqueakStack * (20 - targetSqueakStackLength),
    },
    endID: `${playerID}squeakStack${squeakStackEndIndex}0`,
    gameData: gameData[roomCode],
    playerID,
  });
}
