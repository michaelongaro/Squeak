import { Server, type Socket } from "socket.io";
import {
  type IPlayerMetadata,
  type IRoomConfig,
} from "../../components/CreateRoom/CreateRoom";
import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import generateDeckAndSqueakCards from "../../utils/generateDeckAndSqueakCards";

interface IRoomData {
  [code: string]: IRoomMetadata;
}

interface IRoomMetadata {
  room: IRoomConfig;
  players: IPlayerMetadata[]; // may want to move over to an object to be able to access by userID
}

interface IGameData {
  [code: string]: IGameMetadata;
}

export interface IGameMetadata {
  board: (ICard | null)[][];
  players: IPlayerCards;
}

interface IPlayerCards {
  [code: string]: IPlayerCardMetadata;
}

interface IPlayerCardMetadata {
  squeakPile: ICard[];
  squeakRow: ICard[];
  deck: ICard[];
}

// maybe use this again if you want to show some depth for each "deck" on board
// instead of just showing the top card.
// interface IDeck {
//   cards: ICard[];
//   suit: string;
// }

interface IJoinRoomConfig {
  code: string;
  username: string;
  userID: string;
}

const roomData: IRoomData = {};
const gameData: IGameData = {};
let numberOfPlayersReady = 0;

// @ts-expect-error sdf
export default function SocketHandler(req, res) {
  console.log("server getting hit");

  // It means that socket server was already initialised
  if (res.socket.server.io) {
    console.log("Already set up");
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  const onConnection = (socket: Socket) => {
    // messageHandler(io, socket); maybe split apart into different files later
    // this file looked like this:
    // export default (io, socket) => {
    //   const createdMessage = (msg) => {
    //     socket.broadcast.emit("newIncomingMessage", msg);
    //   };

    //   socket.on("createdMessage", createdMessage);
    // };

    // look more into these methods
    // io.sockets.adapter.rooms.get(roomConfig.code)?.size

    // room logic
    socket.on("createRoom", (roomConfig: IRoomConfig) => {
      socket.join(roomConfig.code);
      roomData[roomConfig.code] = {
        room: roomConfig,
        players: [
          {
            username: roomConfig.hostUsername,
            userID: roomConfig.hostUserID,
          },
        ],
      };
      console.log("on init: ", roomData[roomConfig.code]?.room);
      io.in(roomConfig.code).emit("roomWasCreated");
    });

    socket.on("joinRoom", (roomMetadata: IJoinRoomConfig) => {
      socket.join(roomMetadata.code);
      roomData[roomMetadata.code]?.players.push({
        username: roomMetadata.username,
        userID: roomMetadata.userID,
      });

      console.log(
        "sending back players: ",
        roomData[roomMetadata.code]?.players
      );

      io.in(roomMetadata.code).emit(
        "connectedUsersChanged",
        roomData[roomMetadata.code]?.players
      );

      // how to not have to extract it like this
      const currentPlayersInRoom =
        roomData[roomMetadata.code]?.room?.playersInRoom;
      // console.log("currentPlayersInRoom: ", currentPlayersInRoom);
      const updatedRoomConfig = {
        ...roomData[roomMetadata.code]?.room,

        playersInRoom: currentPlayersInRoom ? currentPlayersInRoom + 1 : 1,
      };

      io.in(roomMetadata.code).emit("roomConfigUpdated", updatedRoomConfig);
    });

    socket.on("updateRoomConfig", (roomConfig: IRoomConfig) => {
      roomData[roomConfig.code]!.room = roomConfig;
      io.in(roomConfig.code).emit("roomConfigUpdated", roomConfig);
    });

    socket.on("startGame", (roomCode) =>
      io.in(roomCode).emit("navigateToPlayScreen")
    );

    // game logic

    socket.on("playerRejoinRoom", (roomCode) => {
      console.log("playerRejoinRoom: ", roomCode);
      socket.join(roomCode);
    });

    socket.on("playerReadyToReceiveInitGameData", (roomCode) => {
      numberOfPlayersReady++;
      // console.log("number of players ready: ", numberOfPlayersReady);

      if (numberOfPlayersReady !== roomData[roomCode]?.players.length) return;

      const currentRoomPlayers = roomData[roomCode]?.players;
      if (currentRoomPlayers) {
        const board = Array.from({ length: 4 }, () =>
          Array.from({ length: 5 }, () => null)
        );

        const playerCards: IPlayerCards = {};
        // loop through players and create + get their cards
        for (const player of currentRoomPlayers) {
          playerCards[player.userID] = generateDeckAndSqueakCards();
        }

        gameData[roomCode] = {
          board,
          players: playerCards,
        };
      }

      // console.log("gameData: ", gameData[roomCode]);

      io.in(roomCode).emit("initGameData", gameData[roomCode]);
      numberOfPlayersReady = 0;
    });

    socket.on("playerFullyReady", (roomCode) => {
      numberOfPlayersReady++;
      if (numberOfPlayersReady === roomData[roomCode]?.players.length) {
        io.in(roomCode).emit("gameStarted");
        numberOfPlayersReady = 0;
      }
    });
  };

  // Define actions inside
  io.on("connection", onConnection);

  console.log("Setting up socket");
  res.end();
}
