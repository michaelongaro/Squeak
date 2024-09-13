import cardPlacementIsValid from "../../../utils/cardPlacementIsValid";

import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IMiscRoomData, type IGameData } from "../socket";

interface IDeckToBoard {
  gameData: IGameData;
  miscRoomData: IMiscRoomData;
  card: ICard;
  playerID: string;
  roomCode: string;
  io: Server;
  boardEndLocation: { row: number; col: number };
}

export function handToBoard({
  gameData,
  miscRoomData,
  card,
  boardEndLocation,
  playerID,
  roomCode,
  io,
}: IDeckToBoard) {
  const board = gameData[roomCode]?.board;
  const players = gameData[roomCode]?.players;
  const player = gameData[roomCode]?.players?.[playerID];
  const miscRoomDataObj = miscRoomData[roomCode];

  if (
    !board ||
    !player ||
    !players ||
    miscRoomDataObj?.preventOtherPlayersFromSqueaking
  )
    return;

  const { row, col } = boardEndLocation;
  const cell = board[row]?.[col]; // idk why only need to ?. on col but w/e?
  if (cell === undefined) return;

  if (
    cardPlacementIsValid(
      cell,
      card.value,
      card.suit,
      boardEndLocation !== undefined,
    )
  ) {
    if (miscRoomDataObj) {
      miscRoomDataObj.boardTimestamps[row]![col] = Date.now();
    }

    player.hand.pop();

    player.deck = player.deck.filter((c) => {
      if (c.value === card.value && c.suit === card.suit) {
        return false;
      }

      return true;
    });

    // not sure how to properly mutate the board without this
    gameData[roomCode]!.board[row]![col] = card;

    io.in(roomCode).emit("cardDropApproved", {
      playerID,
      card,
      cardsInInitialPile: player.hand.length,
      cardsInTargetPile: 0,
      startingCardMetadata: {
        originSqueakStackIdx: undefined,
        destinationSqueakStackIdx: undefined,
        lengthOfStartStack: 1,
      },
      endID: `cell${row}${col}`,
      boardEndLocation,
      gameData: gameData[roomCode],
      updatedPlayerCards: player,
    });

    if (card.value === "K") {
      setTimeout(() => {
        gameData[roomCode]!.board[row]![col] = null;

        io.in(roomCode).emit("syncClientWithServer", gameData[roomCode]);
      }, 700);
    }

    return true;
  } else {
    io.in(roomCode).emit("cardDropDenied", { playerID, card });
    return false;
  }
}
