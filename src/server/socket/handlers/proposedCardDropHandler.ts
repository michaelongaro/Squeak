import type { PlayerSocket as Socket } from "~/types/socket";
import { type Server } from "socket.io";
import { handToBoard } from "../helpers/handToBoard";
import { handToSqueak } from "../helpers/handToSqueak";
import { squeakToBoard } from "../helpers/squeakToBoard";
import { squeakToSqueak } from "../helpers/squeakToSqueak";
import {
  type IGameData,
  type ICardDropProposal,
  type IMiscRoomData,
} from "~/types/socket";

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
    if (
      socket.data.playerID !== playerID ||
      !socket.rooms.has(roomCode) ||
      miscRoomData[roomCode]?.preventOtherPlayersFromSqueaking
    )
      return;
    if (
      !card ||
      typeof card.value !== "string" ||
      typeof card.suit !== "string"
    )
      return;

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
