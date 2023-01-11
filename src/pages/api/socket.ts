import { Server, type Socket } from "socket.io";
import {
  type IPlayerMetadata,
  type IRoomConfig,
} from "../../components/CreateRoom/CreateRoom";
import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import generateDeckAndSqueakCards from "../../utils/generateDeckAndSqueakCards";
import cardPlacementIsValid from "../../utils/cardPlacementIsValid";

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

export interface IPlayerCardMetadata {
  squeakDeck: ICard[];
  squeakHand: ICard[][];
  deck: ICard[];
}

export interface ICardDropProposal {
  card: ICard;
  deckStart?: boolean;
  squeakStartLocation: number;
  boardEndLocation: { row: number; col: number };
  squeakEndLocation: number;
  updatedBoard?: (ICard | null)[][];
  updatedPlayerCards?: IPlayerCards;
  playerID: string;
  roomCode: string;
}

export interface IDrawFromSqueakDeck {
  indexToDrawTo: number;
  playerID: string;
  updatedBoard?: (ICard | null)[][];
  updatedPlayerCards?: IPlayerCards;
  roomCode: string;
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

    socket.on(
      "proposedCardDrop",
      ({
        card,
        deckStart,
        squeakStartLocation,
        boardEndLocation,
        squeakEndLocation,
        playerID,
        roomCode,
      }: ICardDropProposal) => {
        console.log(
          "card: ",
          card,
          "squeakS:",
          squeakStartLocation,
          "squeakE:",
          squeakEndLocation
        );

        if (deckStart && boardEndLocation) {
          const { row, col } = boardEndLocation;
          const cell = gameData[roomCode]?.board?.[row]?.[col] || null;
          if (
            cardPlacementIsValid(
              cell,
              card.value,
              card.suit,
              boardEndLocation !== undefined
            )
          ) {
            // @ts-expect-error asdf
            gameData[roomCode].board[row][col] = card;

            // removing card from player's deck
            // @ts-expect-error asdf
            gameData[roomCode].players[playerID].deck = gameData[
              roomCode
            ]?.players?.[playerID]?.deck.filter((c) => {
              if (c.value === card.value) {
                if (c.suit === card.suit) return false;
              } else if (c.suit === card.suit) {
                if (c.value === card.value) return false;
              }
              return true;
            });

            console.log("gameData: ", gameData[roomCode]?.board);

            io.in(roomCode).emit("cardDropApproved", {
              card,
              deckStart: true,
              boardEndLocation,
              updatedBoard: gameData[roomCode]?.board,
              updatedPlayerCards: gameData[roomCode]?.players,
              playerID,
            });
          } else {
            // ideally should limit to only sending to the player who made the drop
            io.in(roomCode).emit("cardDropDenied", { playerID });
          }
        } else if (deckStart && squeakEndLocation !== null) {
          const squeakStackLocation =
            gameData[roomCode]?.players?.[playerID]?.squeakHand[
              squeakEndLocation
            ];

          if (squeakStackLocation) {
            squeakStackLocation.push(card);

            // removing card from player's deck
            // @ts-expect-error asdf
            gameData[roomCode].players[playerID].deck = gameData[
              roomCode
            ]?.players?.[playerID]?.deck.filter((c) => {
              if (c.value === card.value) {
                if (c.suit === card.suit) return false;
              } else if (c.suit === card.suit) {
                if (c.value === card.value) return false;
              }
              return true;
            });

            io.in(roomCode).emit("cardDropApproved", {
              card,
              deckStart: true,
              squeakEndLocation,
              updatedPlayerCards: gameData[roomCode]?.players,
              playerID,
            });
          }
        } else if (squeakStartLocation !== null && boardEndLocation) {
          const startSqueakStackLocation =
            gameData[roomCode]?.players?.[playerID]?.squeakHand[
              squeakStartLocation
            ];

          const { row, col } = boardEndLocation;
          const cell = gameData[roomCode]?.board?.[row]?.[col] || null;
          if (
            cardPlacementIsValid(
              cell,
              card.value,
              card.suit,
              boardEndLocation !== undefined
            )
          ) {
            // @ts-expect-error asdf
            gameData[roomCode].board[row][col] = card;
            startSqueakStackLocation?.pop();

            console.log("gameBoard:", gameData[roomCode]?.board);

            io.in(roomCode).emit("cardDropApproved", {
              card,
              squeakStartLocation,
              boardEndLocation,
              updatedBoard: gameData[roomCode]?.board,
              updatedPlayerCards: gameData[roomCode]?.players,
              playerID,
            });
          } else {
            // ideally should limit to only sending to the player who made the drop
            io.in(roomCode).emit("cardDropDenied", { playerID });
          }
        } else if (squeakStartLocation !== null && squeakEndLocation !== null) {
          const startSqueakStackLocation =
            gameData[roomCode]?.players?.[playerID]?.squeakHand[
              squeakStartLocation
            ];

          const endSqueakStackLocation =
            gameData[roomCode]?.players?.[playerID]?.squeakHand[
              squeakEndLocation
            ];

          if (endSqueakStackLocation) {
            endSqueakStackLocation.push(card);
            startSqueakStackLocation?.pop();

            io.in(roomCode).emit("cardDropApproved", {
              card,
              squeakStartLocation,
              squeakEndLocation,
              updatedPlayerCards: gameData[roomCode]?.players,
              playerID,
            });
          }
        }
      }
    );

    socket.on(
      "drawFromSqueakDeck",
      ({ indexToDrawTo, playerID, roomCode }: IDrawFromSqueakDeck) => {
        const player = gameData[roomCode]?.players?.[playerID];
        if (player) {
          const card = player.squeakDeck.shift();
          if (card) {
            player.squeakHand?.[indexToDrawTo]?.push(card);

            console.log("gameData: ", gameData[roomCode]?.board);

            io.in(roomCode).emit("cardDrawnFromSqueakDeck", {
              playerID,
              updatedBoard: gameData[roomCode]?.board,
              updatedPlayerCards: gameData[roomCode]?.players,
            });
          }
        }
      }
    );
  };

  // Define actions inside
  io.on("connection", onConnection);

  console.log("Setting up socket");
  res.end();
}
