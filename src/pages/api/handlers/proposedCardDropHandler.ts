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
    squeakStartLocation,
    boardEndLocation,
    squeakEndLocation,
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
    } else if (handStart && squeakEndLocation != null) {
      handToSqueak({
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
        miscRoomData,
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
