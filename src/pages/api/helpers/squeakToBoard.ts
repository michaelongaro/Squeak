import cardPlacementIsValid from "../../../utils/cardPlacementIsValid";

import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IMiscRoomData, type IGameData } from "../socket";
import { drawFromSqueakDeck } from "./drawFromSqueakDeck";

interface ISqueakToBoard {
  gameData: IGameData;
  miscRoomData: IMiscRoomData;
  card: ICard;
  playerID: string;
  roomCode: string;
  io: Server;
  squeakStartLocation: number;
  boardEndLocation: { row: number; col: number };
}

export function squeakToBoard({
  gameData,
  miscRoomData,
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
  const miscRoomDataObj = miscRoomData[roomCode];

  if (
    !board ||
    !players ||
    !startSqueakStackLocation ||
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
    gameData[roomCode]!.board[row]![col] = card;

    io.in(roomCode).emit("cardDropApproved", {
      playerID,
      card,
      startingCardMetadata: {
        originSqueakStackIdx: squeakStartLocation,
        destinationSqueakStackIdx: undefined,
        lengthOfStack: 1,
      },
      endID: `cell${row}${col}`,
      boardEndLocation,
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
