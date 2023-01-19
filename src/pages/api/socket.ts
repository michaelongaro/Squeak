import { Server, type Socket } from "socket.io";
import {
  type IPlayerMetadata,
  type IRoomConfig,
} from "../../components/CreateRoom/CreateRoom";
import {
  type IPlayerCards,
  type ICard,
} from "../../utils/generateDeckAndSqueakCards";
import generateDeckAndSqueakCards from "../../utils/generateDeckAndSqueakCards";
import cardPlacementIsValid from "../../utils/cardPlacementIsValid";
import { drawFromDeckHandler } from "./handlers/drawFromDeckHandler";
import { drawFromSqueakDeckHandler } from "./handlers/drawFromSqueakDeckHandler";
import { proposedCardDropHandler } from "./handlers/proposedCardDropHandler";

interface IRoomData {
  [code: string]: IRoomMetadata;
}

interface IRoomMetadata {
  room: IRoomConfig;
  players: IPlayerMetadata[];
}

export interface IGameData {
  [code: string]: IGameMetadata;
}

export interface IGameMetadata {
  board: (ICard | null)[][];
  players: IPlayerCardsMetadata;
}

interface IPlayerCardsMetadata {
  [code: string]: IPlayerCards;
}

export interface ICardDropProposal {
  card: ICard;
  deckStart?: boolean;
  squeakStartLocation?: number;
  boardEndLocation?: { row: number; col: number };
  squeakEndLocation?: number;
  updatedBoard?: (ICard | null)[][];
  updatedPlayerCards?: IPlayerCardsMetadata;
  playerID: string;
  roomCode: string;
}

export interface IDrawFromSqueakDeck {
  roomCode: string;
  indexToDrawTo: number;
  playerID: string;
  newCard?: ICard;
  updatedBoard?: (ICard | null)[][];
  updatedPlayerCards?: IPlayerCardsMetadata;
}

export interface IDrawFromDeck {
  nextTopCardInDeck: ICard | null;
  topCardsInDeck: (ICard | null)[];
  playerID: string;
  roomCode: string;
  updatedBoard: (ICard | null)[][];
  updatedPlayerCards: IPlayerCardsMetadata;
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
  // means that socket server was already initialised
  if (res.socket.server.io) {
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
      io.in(roomConfig.code).emit("roomWasCreated");
    });

    socket.on("joinRoom", (roomMetadata: IJoinRoomConfig) => {
      socket.join(roomMetadata.code);
      roomData[roomMetadata.code]?.players.push({
        username: roomMetadata.username,
        userID: roomMetadata.userID,
      });

      io.in(roomMetadata.code).emit(
        "connectedUsersChanged",
        roomData[roomMetadata.code]?.players
      );

      // how to not have to extract it like this
      const currentPlayersInRoom =
        roomData[roomMetadata.code]?.room?.playersInRoom;

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

      if (numberOfPlayersReady !== roomData[roomCode]?.players.length) return;

      const currentRoomPlayers = roomData[roomCode]?.players;
      if (currentRoomPlayers) {
        const board = Array.from({ length: 4 }, () =>
          Array.from({ length: 5 }, () => null)
        );

        const playerCards: IPlayerCardsMetadata = {};
        // loop through players and create + get their cards
        for (const player of currentRoomPlayers) {
          playerCards[player.userID] = generateDeckAndSqueakCards();
        }

        gameData[roomCode] = {
          board,
          players: playerCards,
        };
      }

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

    // socket.on("playerDrawFromDeck", ({ playerID, roomCode }: IDrawFromDeck) => {
    //   const playerCards = gameData[roomCode]?.players[playerID];
    //   let deckIdx = playerCards?.deckIdx;
    //   const deck = playerCards?.deck;
    //   let topCardsInDeck = playerCards?.topCardsInDeck;
    //   if (!playerCards || !deck || !deckIdx || !topCardsInDeck) return;

    //   // cards are rendered with the last card in the array at the top of stack
    //   if (deckIdx + 3 <= deck.length) {
    //     topCardsInDeck = [
    //       deck[deckIdx + 1] || null,
    //       deck[deckIdx + 2] || null,
    //       deck[deckIdx + 3] || null,
    //     ];

    //     deckIdx + 3 === deck.length ? (deckIdx = -1) : (deckIdx = deckIdx + 3);
    //   } else {
    //     if (deckIdx + 2 === deck.length) {
    //       topCardsInDeck = [
    //         null,
    //         deck[deckIdx + 1] || null,
    //         deck[deckIdx + 2] || null,
    //       ];
    //     } else if (deckIdx + 1 === deck.length) {
    //       topCardsInDeck = [null, null, deck[deckIdx + 1] || null];
    //     } else {
    //       topCardsInDeck = [null, null, null];
    //     }
    //     deckIdx = -1;
    //   }

    //   const currentTopCardInDeck = playerCards.nextTopCardInDeck;

    //   // updating the reference to the actual player object
    //   playerCards.nextTopCardInDeck =
    //     deck[deckIdx + 3] ?? deck[deckIdx + 2] ?? deck[deckIdx + 1] ?? null;
    //   playerCards.deckIdx = deckIdx;
    //   playerCards.topCardsInDeck = topCardsInDeck;

    //   io.in(roomCode).emit("playerDrawnFromDeck", {
    //     nextTopCardInDeck: currentTopCardInDeck,
    //     playerID,
    //     updatedBoard: gameData[roomCode]?.board,
    //     updatedPlayerCards: gameData[roomCode]?.players,
    //   });
    // });
    drawFromDeckHandler(io, socket, gameData);

    // socket.on(
    //   "drawFromSqueakDeck",
    //   ({ indexToDrawTo, playerID, roomCode }: IDrawFromSqueakDeck) => {
    //     const player = gameData[roomCode]?.players?.[playerID];
    //     if (!player) return;

    //     const card = player.squeakDeck.shift();
    //     if (card) {
    //       player.squeakHand?.[indexToDrawTo]?.push(card);

    //       io.in(roomCode).emit("cardDrawnFromSqueakDeck", {
    //         playerID,
    //         indexToDrawTo,
    //         newCard: card,
    //         updatedBoard: gameData[roomCode]?.board,
    //         updatedPlayerCards: gameData[roomCode]?.players,
    //       });
    //     }
    //   }
    // );
    drawFromSqueakDeckHandler(io, socket, gameData);

    // socket.on(
    //   "proposedCardDrop",
    //   ({
    //     card,
    //     deckStart,
    //     squeakStartLocation,
    //     boardEndLocation,
    //     squeakEndLocation,
    //     playerID,
    //     roomCode,
    //   }: ICardDropProposal) => {

    //     if (deckStart && boardEndLocation) {
    //       const board = gameData[roomCode]?.board;
    //       const player = gameData[roomCode]?.players?.[playerID];

    //       if (!board || !player) return;

    //       const { row, col } = boardEndLocation;
    //       let cell = board[row]?.[col]; // idk why only need to ?. on col but w/e?
    //       if (cell === undefined) return;

    //       if (
    //         cardPlacementIsValid(
    //           cell,
    //           card.value,
    //           card.suit,
    //           boardEndLocation !== undefined
    //         )
    //       ) {
    //         player.topCardsInDeck.pop();
    //         player.topCardsInDeck.unshift(null);

    //         player.deck = player.deck.filter((c) => {
    //           if (c.value === card.value && c.suit === card.suit) {
    //             console.log("card removed from deck");

    //             player.deckIdx--;
    //             return false;
    //           }
    //           // if (c.value === card.value) {                // just in case you need to fall back on this
    //           //   if (c.suit === card.suit) return false;
    //           // } else if (c.suit === card.suit) {
    //           //   if (c.value === card.value) return false;
    //           // }
    //           return true;
    //         });

    //         // hopefully this updates the reference to the actual board object
    //         cell = card;

    //         io.in(roomCode).emit("cardDropApproved", {
    //           card,
    //           endID: `cell${row}${col}`,
    //           updatedBoard: gameData[roomCode]?.board,
    //           updatedPlayerCards: gameData[roomCode]?.players,
    //           playerID,
    //         });
    //       } else {
    //         io.in(roomCode).emit("cardDropDenied", { playerID });
    //       }
    //     } else if (deckStart && squeakEndLocation != null) {
    //       const player = gameData[roomCode]?.players?.[playerID];
    //       const squeakStackLocation =
    //         gameData[roomCode]?.players?.[playerID]?.squeakHand[
    //           squeakEndLocation
    //         ];

    //       if (!player || !squeakStackLocation) return;

    //       squeakStackLocation.push(card);

    //       player.topCardsInDeck.pop();
    //       player.topCardsInDeck.unshift(null);

    //       player.deck = player.deck.filter((c) => {
    //         if (c.value === card.value && c.suit === card.suit) {
    //           console.log("card removed from deck");

    //           player.deckIdx--;
    //           return false;
    //         }
    //         // if (c.value === card.value) {
    //         //   if (c.suit === card.suit) return false;
    //         // } else if (c.suit === card.suit) {
    //         //   if (c.value === card.value) return false;
    //         // }
    //         return true;
    //       });

    //       io.in(roomCode).emit("cardDropApproved", {
    //         card,
    //         endID: `${playerID}squeakHand${squeakEndLocation}`,
    //         updatedBoard: gameData[roomCode]?.board, // ideally shouldn't have to send this
    //         updatedPlayerCards: gameData[roomCode]?.players,
    //         playerID,
    //       });
    //     } else if (squeakStartLocation != null && boardEndLocation) {
    //       const board = gameData[roomCode]?.board;
    //       const startSqueakStackLocation =
    //         gameData[roomCode]?.players?.[playerID]?.squeakHand[
    //           squeakStartLocation
    //         ];

    //       if (!board || !startSqueakStackLocation) return;

    //       const { row, col } = boardEndLocation;
    //       let cell = board[row]?.[col]; // idk why only need to ?. on col but w/e?
    //       if (cell === undefined) return;

    //       if (
    //         cardPlacementIsValid(
    //           cell,
    //           card.value,
    //           card.suit,
    //           boardEndLocation !== undefined
    //         )
    //       ) {
    //         startSqueakStackLocation?.pop();
    //         // hopefully this updates the reference to the actual board object
    //         cell = card;

    //         io.in(roomCode).emit("cardDropApproved", {
    //           card,
    //           endID: `cell${row}${col}`,
    //           updatedBoard: gameData[roomCode]?.board,
    //           updatedPlayerCards: gameData[roomCode]?.players,
    //           playerID,
    //         });
    //       } else {
    //         io.in(roomCode).emit("cardDropDenied", { playerID });
    //       }
    //     } else if (squeakStartLocation != null && squeakEndLocation != null) {
    //       const startSqueakStack =
    //         gameData[roomCode]?.players?.[playerID]?.squeakHand[
    //           squeakStartLocation
    //         ];

    //       let endSqueakStack =
    //         gameData[roomCode]?.players?.[playerID]?.squeakHand[
    //           squeakEndLocation
    //         ];

    //       const indexOfCardInStartStack = startSqueakStack?.findIndex(
    //         (c) => c.value === card.value && c.suit === card.suit
    //       );

    //       if (!startSqueakStack || !endSqueakStack || !indexOfCardInStartStack)
    //         return;

    //       const cardsToMove = startSqueakStack?.splice(indexOfCardInStartStack);

    //       // moving all child cards below the card being moved to the new stack

    //       // gameData[roomCode].players[playerID].squeakHand[squeakEndLocation] =
    //       //   endSqueakStack.concat(cardsToMove);

    //       // hopefully this updates the reference to the actual object
    //       endSqueakStack = endSqueakStack.concat(cardsToMove);

    //       // below was squeakStack:
    //       // gameData[roomCode].players[playerID].squeakHand[
    //       //   squeakEndLocation
    //       // ],

    //       io.in(roomCode).emit("cardDropApproved", {
    //         card,
    //         squeakEndCoords: {
    //           squeakStack: endSqueakStack,
    //           stackOfCardsMoved: cardsToMove,
    //           col: squeakEndLocation,
    //           row: endSqueakStack.length,
    //         },
    //         endID: `${playerID}squeakHand${squeakEndLocation}`,
    //         updatedBoard: gameData[roomCode]?.board, // ideally shouldn't have to send this
    //         updatedPlayerCards: gameData[roomCode]?.players,
    //         playerID,
    //       });
    //     }
    //   }
    // );
    proposedCardDropHandler(io, socket, gameData);
  };

  // Define actions inside
  io.on("connection", onConnection);

  res.end();
}
