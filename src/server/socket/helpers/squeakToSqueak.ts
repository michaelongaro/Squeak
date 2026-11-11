import { scheduleRoundTask } from "./scheduleRoundTask";
import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "~/types/socket";
import { drawFromSqueakDeck } from "./drawFromSqueakDeck";
import cardPlacementIsValid from "~/utils/cardPlacementIsValid";

interface ISqueakToSqueak {
  gameData: IGameData;
  card: ICard;
  playerID: string;
  roomCode: string;
  io: Server;
  squeakStackStartIndex: number;
  squeakStackEndIndex: number;
}

export function squeakToSqueak({
  gameData,
  card,
  playerID,
  roomCode,
  io,
  squeakStackStartIndex,
  squeakStackEndIndex,
}: ISqueakToSqueak) {
  const board = gameData[roomCode]?.board;
  const players = gameData[roomCode]?.players;
  const player = gameData[roomCode]?.players?.[playerID];
  const startSqueakStack = player?.squeakHand[squeakStackStartIndex];

  const endSqueakStack = player?.squeakHand[squeakStackEndIndex];

  const indexOfCardInStartStack = startSqueakStack?.findIndex(
    (c) => c.value === card.value && c.suit === card.suit,
  );

  if (
    !board ||
    !players ||
    !player ||
    !startSqueakStack ||
    !endSqueakStack ||
    indexOfCardInStartStack === undefined
  )
    return;

  if (
    indexOfCardInStartStack < 0 ||
    squeakStackStartIndex === squeakStackEndIndex ||
    (endSqueakStack.length === 0 && player.squeakDeck.length > 0) ||
    !cardPlacementIsValid(
      endSqueakStack.at(-1) ?? null,
      card.value,
      card.suit,
      false,
    )
  ) {
    io.in(roomCode).emit("cardDropDenied", { playerID, card });
    return false;
  }

  const cardsToMove = startSqueakStack?.splice(indexOfCardInStartStack);

  // automatically draw a card if the squeak stack is empty
  if (startSqueakStack?.length === 0) {
    scheduleRoundTask(
      gameData,
      roomCode,
      () => {
        drawFromSqueakDeck({
          indexToDrawTo: squeakStackStartIndex,
          playerID,
          roomCode,
          gameData,
          io,
        });
      },
      500,
    );
  }

  // moving all child cards below the card being moved to the new stack
  gameData[roomCode]!.players[playerID]!.squeakHand[squeakStackEndIndex] =
    endSqueakStack.concat(cardsToMove);

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
    playerID,
    card,
    cardsInInitialPile: 0, // fyi: 0, because this is in relation to the pseudoVerticalDepth calculations which don't apply here
    cardsInTargetPile: 0, // fyi: 0, because this is in relation to the pseudoVerticalDepth calculations which don't apply here
    startingCardMetadata: {
      originSqueakStackIdx: squeakStackStartIndex,
      destinationSqueakStackIdx: squeakStackEndIndex,
      lengthOfStartStack: cardsToMove.length,
      lengthOfTargetStack: targetSqueakStackLength,
      indexWithinStartStack: indexOfCardInStartStack,
    },
    squeakEndCoords: {
      offsetHeight:
        indexWithinTargetSqueakStack * (20 - targetSqueakStackLength),
    },
    endID: `${playerID}squeakStack${squeakStackEndIndex}0`,
    gameData: gameData[roomCode],
  });
}
