import { type Server, type Socket } from "socket.io";
import { handToBoard } from "../helpers/handToBoard";
import { handToSqueak } from "../helpers/handToSqueak";
import { squeakToBoard } from "../helpers/squeakToBoard";
import { squeakToSqueak } from "../helpers/squeakToSqueak";
import {
  type IGameData,
  type ICardDropProposal,
  type IMiscRoomData,
} from "../socket";

export function proposedCardDropHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  miscRoomData: IMiscRoomData,
) {
  function proposedCardDrop({
    card,
    handStart,
    squeakStackStartIndex,
    boardEndLocation,
    squeakStackEndIndex,
    playerID,
    roomCode,
  }: ICardDropProposal) {
    if (handStart && boardEndLocation) {
      handToBoard({
        gameData,
        miscRoomData,
        card,
        boardEndLocation,
        playerID,
        roomCode,
        io,
      });
    } else if (handStart && squeakStackEndIndex != null) {
      handToSqueak({
        gameData,
        card,
        squeakStackEndIndex,
        playerID,
        roomCode,
        io,
      });
    } else if (squeakStackStartIndex != null && boardEndLocation) {
      squeakToBoard({
        gameData,
        miscRoomData,
        card,
        squeakStackStartIndex,
        boardEndLocation,
        playerID,
        roomCode,
        io,
      });
    } else if (squeakStackStartIndex != null && squeakStackEndIndex != null) {
      squeakToSqueak({
        gameData,
        card,
        squeakStackStartIndex,
        squeakStackEndIndex,
        playerID,
        roomCode,
        io,
      });
    }
  }

  socket.on("proposedCardDrop", proposedCardDrop);
}
