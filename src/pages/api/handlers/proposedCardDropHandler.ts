import { type Server, type Socket } from "socket.io";
import { deckToBoard } from "../helpers/deckToBoard";
import { deckToSqueak } from "../helpers/deckToSqueak";
import { squeakToBoard } from "../helpers/squeakToBoard";
import { squeakToSqueak } from "../helpers/squeakToSqueak";
import { type IGameData, type ICardDropProposal } from "../socket";

export function proposedCardDropHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData
) {
  function proposedCardDrop({
    card,
    deckStart,
    squeakStartLocation,
    boardEndLocation,
    squeakEndLocation,
    playerID,
    roomCode,
  }: ICardDropProposal) {
    if (deckStart && boardEndLocation) {
      deckToBoard({ gameData, card, boardEndLocation, playerID, roomCode, io });
    } else if (deckStart && squeakEndLocation != null) {
      deckToSqueak({
        gameData,
        card,
        squeakEndLocation,
        playerID,
        roomCode,
        io,
      });
    } else if (squeakStartLocation != null && boardEndLocation) {
      squeakToBoard({
        gameData,
        card,
        squeakStartLocation,
        boardEndLocation,
        playerID,
        roomCode,
        io,
      });
    } else if (squeakStartLocation != null && squeakEndLocation != null) {
      squeakToSqueak({
        gameData,
        card,
        squeakStartLocation,
        squeakEndLocation,
        playerID,
        roomCode,
        io,
      });
    }
  }

  socket.on("proposedCardDrop", proposedCardDrop);
}
