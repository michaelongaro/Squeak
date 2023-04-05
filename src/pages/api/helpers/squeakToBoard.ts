import cardPlacementIsValid from "../../../utils/cardPlacementIsValid";

import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../socket";
import { drawFromSqueakDeck } from "./drawFromSqueakDeck";

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
  const players = gameData[roomCode]?.players;
  const player = gameData[roomCode]?.players?.[playerID];
  const startSqueakStackLocation = player?.squeakHand[squeakStartLocation];

  if (!board || !players || !startSqueakStackLocation) return;

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

    // automatically draw a card if the squeak stack is empty
    if (startSqueakStackLocation?.length === 0) {
      setTimeout(() => {
        drawFromSqueakDeck({
          indexToDrawTo: squeakStartLocation,
          playerID,
          roomCode,
          gameData,
          io,
        });
      }, 350);
    }

    // not sure how to properly mutate the board without this
    gameData[roomCode]!.board[row]![col] = card.value === "K" ? null : card;

    io.in(roomCode).emit("cardDropApproved", {
      playerID,
      card,
      endID: `cell${row}${col}`,
      updatedGameData: gameData[roomCode],
    });
  } else {
    io.in(roomCode).emit("cardDropDenied", { playerID });
  }
}
