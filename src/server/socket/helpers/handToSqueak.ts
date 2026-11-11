import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "~/types/socket";
import cardPlacementIsValid from "~/utils/cardPlacementIsValid";
import { cardsMatch } from "./cardsMatch";

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

  if (
    !cardsMatch(player.hand.at(-1), card) ||
    (squeakStackLocation.length === 0 && player.squeakDeck.length > 0) ||
    !cardPlacementIsValid(
      squeakStackLocation.at(-1) ?? null,
      card.value,
      card.suit,
      false,
    )
  ) {
    io.in(roomCode).emit("cardDropDenied", { playerID, card });
    return false;
  }

  squeakStackLocation.push(card);

  player.hand.pop();

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
    cardsInInitialPile: player.hand.length,
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
