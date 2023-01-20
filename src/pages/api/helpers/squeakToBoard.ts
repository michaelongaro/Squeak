import cardPlacementIsValid from "../../../utils/cardPlacementIsValid";

import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../socket";

interface ISqueakToBoard {
  gameData: IGameData;
  card: ICard;
  playerID: string;
  roomCode: string;
  io: Server;
  squeakStartLocation: number;
  boardEndLocation: { row: number; col: number };
}

export function squeakToBoard({
  gameData,
  card,
  playerID,
  roomCode,
  io,
  squeakStartLocation,
  boardEndLocation,
}: ISqueakToBoard) {
  const board = gameData[roomCode]?.board;
  const startSqueakStackLocation =
    gameData[roomCode]?.players?.[playerID]?.squeakHand[squeakStartLocation];

  if (!board || !startSqueakStackLocation) return;

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
    startSqueakStackLocation?.pop();

    // not sure how to properly mutate the board without this
    gameData[roomCode]!.board[row]![col]! = card;

    console.log(gameData[roomCode]?.board);

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
