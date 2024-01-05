import { type Server, type Socket } from "socket.io";
import {
  type IRoomData,
  type IGameData,
  type IMiscRoomData,
  type IPlayerCardsMetadata,
} from "../socket";
import generateDeckAndSqueakCards from "../../../utils/generateDeckAndSqueakCards";

export function playerReadyToReceiveInitGameDataHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData,
  gameData: IGameData,
  miscRoomData: IMiscRoomData
) {
  socket.on("playerReadyToReceiveInitGameData", (roomCode) => {
    const miscRoomDataObj = miscRoomData[roomCode];

    if (!miscRoomDataObj) return;
    miscRoomDataObj.numberOfPlayersReady++;

    const players = roomData[roomCode]?.players;

    if (
      !players ||
      miscRoomDataObj.numberOfPlayersReady !== Object.keys(players).length
    )
      return;

    // get rid of counter, just do this on "startGame" handler, and send the gameData[roomCode] back to the client

    const board = Array.from({ length: 4 }, () =>
      Array.from({ length: 5 }, () => null)
    );

    const playerCards: IPlayerCardsMetadata = {};
    // loop through players and create + get their cards
    for (const playerID of Object.keys(players)) {
      playerCards[playerID] = {
        ...generateDeckAndSqueakCards(),
        totalPoints: 0,
        rankInRoom: -1,
      };
    }

    gameData[roomCode] = {
      board,
      players: playerCards,
      currentRound: 1,
      playerIDsThatLeftMidgame: [],
    };

    io.in(roomCode).emit("initGameData", gameData[roomCode]);
    miscRoomDataObj.numberOfPlayersReady = 0;
  });
}
