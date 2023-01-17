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
  topCardsInDeck: (ICard | null)[];
}

export interface IPlayerDrawFromDeck {
  topCardsInDeck: (ICard | null)[];
  playerID: string;
  roomCode: string;
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
  roomCode: string;
  indexToDrawTo: number;
  playerID: string;
  newCard?: ICard;
  updatedBoard?: (ICard | null)[][];
  updatedPlayerCards?: IPlayerCards;
}

export interface IDrawFromDeck {
  topCard: ICard;
  playerID: string;
  updatedBoard: (ICard | null)[][];
  updatedPlayerCards: IPlayerCards;
}

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
      "playerDrawFromDeck",
      ({ topCardsInDeck, playerID, roomCode }: IPlayerDrawFromDeck) => {
        const playerCards = gameData[roomCode]?.players[playerID];

        if (playerCards) {
          playerCards.topCardsInDeck = topCardsInDeck;
        }

        io.in(roomCode).emit("playerDrawnFromDeck", {
          updatedBoard: gameData[roomCode]?.board,
          updatedPlayerCards: gameData[roomCode]?.players,
        });
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

            io.in(roomCode).emit("cardDrawnFromSqueakDeck", {
              playerID,
              indexToDrawTo,
              newCard: card,
              updatedBoard: gameData[roomCode]?.board,
              updatedPlayerCards: gameData[roomCode]?.players,
            });
          }
        }
      }
    );

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

            // shifting topCardsInDeck
            const topCardsInDeck =
              gameData[roomCode]?.players[playerID]?.topCardsInDeck;

            if (topCardsInDeck) {
              topCardsInDeck.pop();
              topCardsInDeck.unshift(null);
            }

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
              // deckStart: true,
              // boardEndLocation,
              endID: `cell${row}${col}`,
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

            // shifting topCardsInDeck
            const topCardsInDeck =
              gameData[roomCode]?.players[playerID]?.topCardsInDeck;

            if (topCardsInDeck) {
              topCardsInDeck.pop();
              topCardsInDeck.unshift(null);
            }

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
              // deckStart: true,
              // squeakEndCoords: {
              //   col: squeakEndLocation,
              //   row: squeakStackLocation.length,
              // },
              endID: `${playerID}squeakHand${squeakEndLocation}`,
              updatedBoard: gameData[roomCode]?.board, // ideally shouldn't have to send this
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
              // squeakStartLocation,
              // boardEndLocation,
              endID: `cell${row}${col}`,
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

          const indexOfCardInStartStack = startSqueakStackLocation?.findIndex(
            (c) => c.value === card.value && c.suit === card.suit
          );

          const cardsToMove = startSqueakStackLocation?.splice(
            indexOfCardInStartStack!
          );

          if (endSqueakStackLocation && cardsToMove) {
            // moving all child cards below the card being moved to the new stack
            // @ts-expect-error asqdf
            gameData[roomCode].players[playerID].squeakHand[squeakEndLocation] =
              endSqueakStackLocation.concat(cardsToMove);

            io.in(roomCode).emit("cardDropApproved", {
              card,
              // squeakStartLocation,
              squeakEndCoords: {
                squeakStack:
                  // @ts-expect-error asqdf
                  gameData[roomCode].players[playerID].squeakHand[
                    squeakEndLocation
                  ],
                stackOfCardsMoved: cardsToMove,
                col: squeakEndLocation,
                row: endSqueakStackLocation.length,
              },
              endID: `${playerID}squeakHand${squeakEndLocation}`,
              updatedBoard: gameData[roomCode]?.board, // ideally shouldn't have to send this
              updatedPlayerCards: gameData[roomCode]?.players,
              playerID,
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
