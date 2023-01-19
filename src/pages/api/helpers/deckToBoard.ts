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
  let cell = board[row]?.[col]; // idk why only need to ?. on col but w/e?
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
        console.log("card removed from deck");

        player.deckIdx--;
        return false;
      }
      // if (c.value === card.value) {                // just in case you need to fall back on this
      //   if (c.suit === card.suit) return false;
      // } else if (c.suit === card.suit) {
      //   if (c.value === card.value) return false;
      // }
      return true;
    });

    // hopefully this updates the reference to the actual board object
    cell = card;

    // pretty sure that this doesn't update the reference to the actual board object

    io.in(roomCode).emit("cardDropApproved", {
      card,
      endID: `cell${row}${col}`,
      updatedBoard: gameData[roomCode]?.board,
      updatedPlayerCards: gameData[roomCode]?.players,
      playerID,
    });
  } else {
    io.in(roomCode).emit("cardDropDenied", { playerID });
  }
}
