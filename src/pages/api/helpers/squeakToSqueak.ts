import { type Server } from "socket.io";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../socket";

interface ISqueakToSqueak {
  gameData: IGameData;
  card: ICard;
  playerID: string;
  roomCode: string;
  io: Server;
  squeakStartLocation: number;
  squeakEndLocation: number;
}

export function squeakToSqueak({
  gameData,
  card,
  playerID,
  roomCode,
  io,
  squeakStartLocation,
  squeakEndLocation,
}: ISqueakToSqueak) {
  const startSqueakStack =
    gameData[roomCode]?.players?.[playerID]?.squeakHand[squeakStartLocation];

  let endSqueakStack =
    gameData[roomCode]?.players?.[playerID]?.squeakHand[squeakEndLocation];

  const indexOfCardInStartStack = startSqueakStack?.findIndex(
    (c) => c.value === card.value && c.suit === card.suit
  );

  if (!startSqueakStack || !endSqueakStack || !indexOfCardInStartStack) return;

  const cardsToMove = startSqueakStack?.splice(indexOfCardInStartStack);

  // moving all child cards below the card being moved to the new stack

  // gameData[roomCode].players[playerID].squeakHand[squeakEndLocation] =
  //   endSqueakStack.concat(cardsToMove);

  // hopefully this updates the reference to the actual object
  endSqueakStack = endSqueakStack.concat(cardsToMove);

  // below was squeakStack:
  // gameData[roomCode].players[playerID].squeakHand[
  //   squeakEndLocation
  // ],

  io.in(roomCode).emit("cardDropApproved", {
    card,
    squeakEndCoords: {
      squeakStack: endSqueakStack,
      stackOfCardsMoved: cardsToMove,
      col: squeakEndLocation,
      row: endSqueakStack.length,
    },
    endID: `${playerID}squeakHand${squeakEndLocation}`,
    updatedBoard: gameData[roomCode]?.board, // ideally shouldn't have to send this
    updatedPlayerCards: gameData[roomCode]?.players,
    playerID,
  });
}
