import { Server, type Socket } from "socket.io";
import { type IRoomConfig } from "../../components/CreateRoom/CreateRoom";
import {
  type IPlayerCards,
  type ICard,
} from "../../utils/generateDeckAndSqueakCards";
import generateDeckAndSqueakCards from "../../utils/generateDeckAndSqueakCards";
import { drawFromDeckHandler } from "./handlers/drawFromDeckHandler";
import { proposedCardDropHandler } from "./handlers/proposedCardDropHandler";
import { gameStuckHandler } from "./handlers/gameStuckHandler";
import { drawFromSqueakDeck } from "./helpers/drawFromSqueakDeck";
import { roundOverHandler } from "./handlers/roundOverHandler";
import { resetGameHandler } from "./handlers/resetGameHandler";
import { avatarPaths } from "../../utils/avatarPaths";
import { hslToDeckHueRotations } from "../../utils/hslToDeckHueRotations";
import { leaveRoomHandler } from "./handlers/leaveRoomHandler";
import { initializeAuthorizedPlayerInFriendsObject } from "./handlers/initializeAuthorizedPlayerInFriendsObject";
import { modifyFriendDataHandler } from "./handlers/modifyFriendDataHandler";

// TODO: is there a better way to type these?
export interface IFriendsData {
  [userID: string]: IFriendsMetadata;
}

export interface IFriendsMetadata {
  friendIDs: string[];
  friendInviteIDs: string[];
  roomInviteIDs: string[];
}

export interface IRoomData {
  [code: string]: IRoomMetadata;
}

interface IRoomMetadata {
  roomConfig: IRoomConfig;
  players: IRoomPlayersMetadata;
}

export interface IMiscRoomData {
  [code: string]: IMiscRoomMetadata;
}

interface IMiscRoomMetadata {
  numberOfPlayersReady: number;
  rotateDecksCounter: number;
  gameStuckInterval?: NodeJS.Timeout;
}

export interface IGameData {
  [code: string]: IGameMetadata;
}

export interface IGameMetadata {
  board: (ICard | null)[][];
  players: IPlayerCardsMetadata;
  currentRound: number;
  playerIDsThatLeftMidgame: string[];
}

export interface IPlayerCardsMetadata {
  [userID: string]: IPlayer;
}

export interface IRoomPlayersMetadata {
  [userID: string]: IRoomPlayer;
}

export interface IRoomPlayer {
  username: string;
  avatarPath: string;
  color: string;
  deckHueRotation: number;
}

export interface IModifyFriendData {
  action:
    | "sendFriendInvite"
    | "acceptFriendInvite"
    | "declineFriendInvite"
    | "sendRoomInvite"
    | "acceptRoomInvite"
    | "declineRoomInvite"
    | "createRoom"
    | "joinRoom"
    | "roomMetadataUpdate"
    | "startGame"
    | "leaveRoom" // this is also called when a player is kicked from a room
    | "removeFriend"
    | "goOffline"
    | "goOnline";
  initiatorID: string;
  targetID?: string;
  roomCode?: string;
  currentRoomIsPublic?: boolean;
  currentRoomIsFull?: boolean;
}

export interface ICardDropProposal {
  card: ICard;
  deckStart?: boolean;
  squeakStartLocation?: number;
  boardEndLocation?: { row: number; col: number };
  squeakEndLocation?: number;
  updatedBoard: (ICard | null)[][];
  updatedPlayerCards: IPlayerCardsMetadata;
  playerID: string;
  roomCode: string;
}

export interface IDrawFromSqueakDeck {
  roomCode: string;
  indexToDrawTo: number;
  playerID: string;
  newCard?: ICard;
  updatedBoard: (ICard | null)[][];
  updatedPlayerCards: IPlayerCardsMetadata;
}

export interface IDrawFromDeck {
  nextTopCardInDeck: ICard | null;
  resetDeck?: boolean;
  topCardsInDeck: (ICard | null)[];
  playerID: string;
  roomCode: string;
  updatedBoard: (ICard | null)[][];
  updatedPlayerCards: IPlayerCardsMetadata;
}

export interface IRoundOver {
  roomCode: string;
  roundWinnerID: string;
}

export interface IPlayer extends IPlayerCards {
  totalPoints: number;
  rankInRoom: number;
}

export interface IUpdatePlayerMetadata {
  newPlayerMetadata: IRoomPlayer;
  playerID: string;
  roomCode: string;
}

export interface IReceiveFriendData {
  playerID: string;
  friendData: IFriendsMetadata;
}

export interface IMoveBackToLobby {
  roomConfig: IRoomConfig;
  players: IRoomPlayersMetadata;
  gameData: IGameMetadata;
}

export interface IPlayerHasLeftRoom {
  roomConfig: IRoomConfig;
  players: IRoomPlayersMetadata;
  gameData: IGameMetadata;
  newHostID: string;
  playerWhoLeftID: string;
}

interface IStartGame {
  roomCode: string;
  firstRound: boolean;
}

interface IJoinRoomConfig {
  code: string;
  userID: string;
  playerMetadata: IRoomPlayer;
}

const roomData: IRoomData = {};
const gameData: IGameData = {};
const friendsData: IFriendsData = {};
const miscRoomData: IMiscRoomData = {};

// @ts-expect-error sdf
export default function SocketHandler(req, res) {
  // means that socket server was already initialised
  if (res.socket.server.io) {
    res.end();
    return;
  }

  //8081
  const io = new Server(res.socket.server, {
    path: "/api/socket",
  });
  res.socket.server.io = io;

  const onConnection = (socket: Socket) => {
    // room logic
    socket.on(
      "createRoom",
      (roomConfig: IRoomConfig, playerMetadata: IRoomPlayer) => {
        socket.join(roomConfig.code);

        roomData[roomConfig.code] = {
          roomConfig,
          players: {
            [roomConfig.hostUserID]: playerMetadata,
          },
        };

        miscRoomData[roomConfig.code] = {
          numberOfPlayersReady: 0,
          rotateDecksCounter: 0,
        };

        io.in(roomConfig.code).emit("roomWasCreated");
      }
    );

    socket.on(
      "joinRoom",
      ({ userID, playerMetadata, code }: IJoinRoomConfig) => {
        const room = roomData[code];
        const players = roomData[code]?.players;

        if (!room || !players) return;

        socket.join(code);

        // checking to see if the playerMetadata is available,
        // if not it will auto select random available settings

        for (const player of Object.values(players)) {
          if (player.avatarPath === playerMetadata.avatarPath) {
            playerMetadata.avatarPath = getAvailableAttribute(
              "avatarPath",
              players
            );
          }

          if (player.color === playerMetadata.color) {
            playerMetadata.color = getAvailableAttribute("color", players);
          }

          playerMetadata.deckHueRotation =
            hslToDeckHueRotations[
              playerMetadata.color as keyof typeof hslToDeckHueRotations
            ];
        }

        function getAvailableAttribute(
          attribute: "avatarPath" | "color",
          players: IRoomPlayersMetadata
        ): string {
          if (attribute === "avatarPath") {
            const usedAttributes = Object.values(players).map(
              (player) => player.avatarPath
            );

            const availableAttributes = [
              ...usedAttributes,
              ...avatarPaths,
            ].filter((avatarPath) => !usedAttributes.includes(avatarPath));

            return availableAttributes[
              Math.floor(Math.random() * availableAttributes.length)
            ]!;
          }

          const usedAttributes = Object.values(players).map(
            (player) => player.color
          );

          const availableAttributes = [
            ...usedAttributes,
            ...Object.keys(hslToDeckHueRotations),
          ].filter((color) => !usedAttributes.includes(color));

          return availableAttributes[
            Math.floor(Math.random() * availableAttributes.length)
          ]!;
        }

        players[userID] = playerMetadata;

        io.in(code).emit("playerMetadataUpdated", players);

        room.roomConfig.playersInRoom++;

        io.in(code).emit("roomConfigUpdated", room.roomConfig);
      }
    );

    socket.on("updateRoomConfig", (roomConfig: IRoomConfig) => {
      const room = roomData[roomConfig.code];
      if (!room) return;
      room.roomConfig = roomConfig;
      io.in(roomConfig.code).emit("roomConfigUpdated", roomConfig);
    });

    socket.on(
      "updatePlayerMetadata",
      ({ newPlayerMetadata, playerID, roomCode }: IUpdatePlayerMetadata) => {
        const room = roomData[roomCode];
        const user = roomData[roomCode]?.players[playerID];

        if (!room || !user) return;

        user.avatarPath = newPlayerMetadata.avatarPath;
        user.color = newPlayerMetadata.color;
        user.deckHueRotation = newPlayerMetadata.deckHueRotation;
        user.username = newPlayerMetadata.username;

        io.in(roomCode).emit("playerMetadataUpdated", room.players);
      }
    );

    socket.on("startGame", ({ roomCode, firstRound }: IStartGame) => {
      if (firstRound) {
        io.in(roomCode).emit("navigateToPlayScreen");
      }

      // loop through all players and flip their squeak deck cards
      const currentRoomPlayers = roomData[roomCode]?.players;
      if (!currentRoomPlayers) return;

      for (const index in Object.keys(currentRoomPlayers)) {
        const playerID = Object.keys(currentRoomPlayers)[parseInt(index)];
        if (playerID === undefined) return;

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 0,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 1500 + parseInt(index) * 400);

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 1,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 2000 + parseInt(index) * 400);

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 2,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 2500 + parseInt(index) * 400);

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 3,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 3000 + parseInt(index) * 400);
      }

      // start interval that checks + handles if game is stuck
      // (no player has a valid move available)
      const miscRoomDataObj = miscRoomData[roomCode];

      if (!miscRoomDataObj) return;

      miscRoomDataObj.gameStuckInterval = setInterval(() => {
        gameStuckHandler(io, roomCode, gameData, miscRoomData);
      }, 15000);
    });

    // game logic
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

    socket.on("playerFullyReady", (roomCode) => {
      const miscRoomDataObj = miscRoomData[roomCode];

      if (!miscRoomDataObj) return;
      miscRoomDataObj.numberOfPlayersReady++;

      const room = roomData[roomCode];

      if (
        room &&
        miscRoomDataObj.numberOfPlayersReady ===
          Object.keys(room.players).length
      ) {
        room.roomConfig.gameStarted = true;
        io.in(roomCode).emit("roomConfigUpdated", room.roomConfig);
        io.in(roomCode).emit("gameStarted");
        miscRoomDataObj.numberOfPlayersReady = 0;
      }
    });

    socket.on("directlyLeaveRoom", (roomCode) => {
      socket.leave(roomCode);
    });

    // game/room handlers
    drawFromDeckHandler(io, socket, gameData);

    proposedCardDropHandler(io, socket, gameData);

    roundOverHandler(io, socket, gameData, roomData);

    resetGameHandler(io, socket, gameData, roomData, miscRoomData);

    leaveRoomHandler(io, socket, gameData, roomData, miscRoomData);

    // friends handlers
    initializeAuthorizedPlayerInFriendsObject(io, socket, friendsData);

    modifyFriendDataHandler(io, socket, friendsData);
  };

  // Define actions inside
  io.on("connection", onConnection);

  res.end();
}
