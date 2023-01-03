import { Server, type Socket } from "socket.io";
import {
  type IPlayerMetadata,
  type IRoomConfig,
} from "../../components/CreateRoom/CreateRoom";

interface IRoomData {
  [code: string]: IGameData;
}

interface IGameData {
  game: IGameMetadata;
  room: IRoomConfig;
  players: IPlayerMetadata[]; // may want to move over to an object to be able to access by userID
}

interface IGameMetadata {
  board: IDeck[][]; // 2d array of cards
  // player
}

interface IDeck {
  cards: ICard[];
  suit: number;
}

interface ICard {
  value: number;
  suit: number;
}

interface IRoomMetadata {
  code: string;
  username: string;
  userID: string;
}

const roomData: IRoomData = {};
let numberOfPlayersReady = 0;

// @ts-expect-error sdf
export default function SocketHandler(req, res) {
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

    socket.on("createRoom", (roomConfig: IRoomConfig) => {
      socket.join(roomConfig.code);
      roomData[roomConfig.code] = {
        // initialize 10x10 board here, (this obj will also hold player card data)
        game: {
          board: Array.from({ length: 10 }, () =>
            Array.from({ length: 10 }, () => ({ cards: [], suit: 0 }))
          ),
        },
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

    socket.on("joinRoom", (roomMetadata: IRoomMetadata) => {
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
      console.log("currentPlayersInRoom: ", currentPlayersInRoom);
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

    // look this over
    socket.on("playerReady", (roomCode) => {
      numberOfPlayersReady++;
      console.log("number of players ready: ", numberOfPlayersReady);
      if (numberOfPlayersReady === roomData[roomCode]?.players.length) {
        io.in(roomCode).emit("startGame");
        numberOfPlayersReady = 0;
      }
    });
  };

  // Define actions inside
  io.on("connection", onConnection);

  console.log("Setting up socket");
  res.end();
}
