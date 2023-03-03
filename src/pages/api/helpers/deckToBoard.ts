import cardPlacementIsValid from "../../../utils/cardPlacementIsValid";

import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../socket";

interface IDeckToBoard {
  gameData: IGameData;
  card: ICard;
  playerID: string;
  roomCode: string;
  io: Server;
  boardEndLocation: { row: number; col: number };
}

export function deckToBoard({
  gameData,
  card,
  boardEndLocation,
  playerID,
  roomCode,
  io,
}: IDeckToBoard) {
  const board = gameData[roomCode]?.board;
  const player = gameData[roomCode]?.players?.[playerID];

  if (!board || !player) return;

  const { row, col } = boardEndLocation;
  const cell = board[row]?.[col]; // idk why only need to ?. on col but w/e?
  if (cell === undefined) return;

  if (
    cardPlacementIsValid(
      cell,
      card.value,
      card.suit,
      boardEndLocation !== undefined
    )
  ) {
    player.topCardsInDeck.pop();
    player.topCardsInDeck.unshift(null);

    player.deck = player.deck.filter((c) => {
      if (c.value === card.value && c.suit === card.suit) {
        return false;
      }

      return true;
    });

    // not sure how to properly mutate the board without this
    gameData[roomCode]!.board[row]![col] = card.value === "K" ? null : card;

    io.in(roomCode).emit("cardDropApproved", {
      card,
      endID: `cell${row}${col}`,
      newBoard: board,
      newPlayerCards: player,
      playerID,
    });
  } else {
    io.in(roomCode).emit("cardDropDenied", { playerID });
  }
}
