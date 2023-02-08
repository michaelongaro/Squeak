import { Server, type Socket } from "socket.io";
import { type IRoomConfig } from "../../components/CreateRoom/CreateRoom";
import {
  type IPlayerCards,
  type ICard,
} from "../../utils/generateDeckAndSqueakCards";
import generateDeckAndSqueakCards from "../../utils/generateDeckAndSqueakCards";
import { drawFromDeckHandler } from "./handlers/drawFromDeckHandler";
import { drawFromSqueakDeckHandler } from "./handlers/drawFromSqueakDeckHandler";
import { proposedCardDropHandler } from "./handlers/proposedCardDropHandler";
import { gameStuckHandler } from "./handlers/gameStuckHandler";
import { drawFromSqueakDeck } from "./helpers/drawFromSqueakDeck";
import { roundOverHandler } from "./handlers/roundOverHandler";
import { resetGameHandler } from "./handlers/resetGameHandler";
import { avatarPaths } from "../../utils/avatarPaths";
import { deckHueRotations } from "../../utils/deckHueRotations";
import { hslToDeckHueRotations } from "../../utils/hslToDeckHueRotations";

export interface IRoomData {
  [code: string]: IRoomMetadata;
}

interface IRoomMetadata {
  roomConfig: IRoomConfig;
  players: IRoomPlayersMetadata;
}

// TODO: is there a better way to type these?
// if not at least find a better name for them + swap IGameData and IGameMetadata
// for consistency

export interface IGameData {
  [code: string]: IGameMetadata;
}

export interface IGameMetadata {
  board: (ICard | null)[][];
  players: IPlayerCardsMetadata;
  currentRound: number;
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

export interface IPlayer extends IPlayerCards {
  totalPoints: number;
  rankInRoom: number;
}

export interface IUpdatePlayerMetadata {
  newPlayerMetadata: IRoomPlayer;
  playerID: string;
  roomCode: string;
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
let numberOfPlayersReady = 0;
let gameStuckInterval: ReturnType<typeof setTimeout>;

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

        io.in(roomConfig.code).emit("roomWasCreated");
      }
    );

    socket.on(
      "joinRoom",
      ({ userID, playerMetadata, code }: IJoinRoomConfig) => {
        const players = roomData[code]?.players;

        if (!players) return;

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

        const currentPlayersInRoom = roomData[code]?.roomConfig?.playersInRoom;

        const updatedRoomConfig = {
          ...roomData[code]?.roomConfig,

          playersInRoom: currentPlayersInRoom ? currentPlayersInRoom + 1 : 1,
        };

        io.in(code).emit("roomConfigUpdated", updatedRoomConfig);
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
        }, 500 + parseInt(index) * 50);

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 1,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 1000 + parseInt(index) * 50);

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 2,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 1500 + parseInt(index) * 50);

        setTimeout(() => {
          drawFromSqueakDeck({
            indexToDrawTo: 3,
            playerID,
            roomCode,
            gameData,
            io,
          });
        }, 2000 + parseInt(index) * 50);
      }

      // start interval that checks + handles if game is stuck
      // (no player has a valid move available)
      gameStuckInterval = setInterval(() => {
        gameStuckHandler(io, gameData, roomCode);
      }, 15000);
    });

    // game logic
    socket.on("playerReadyToReceiveInitGameData", (roomCode) => {
      numberOfPlayersReady++;

      const players = roomData[roomCode]?.players;

      if (!players || numberOfPlayersReady !== Object.keys(players).length)
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
      };

      io.in(roomCode).emit("initGameData", gameData[roomCode]);
      numberOfPlayersReady = 0;
    });

    socket.on("playerFullyReady", (roomCode) => {
      numberOfPlayersReady++;

      const players = roomData[roomCode]?.players;

      if (players && numberOfPlayersReady === Object.keys(players).length) {
        io.in(roomCode).emit("gameStarted");
        numberOfPlayersReady = 0;
      }
    });

    drawFromDeckHandler(io, socket, gameData);

    proposedCardDropHandler(io, socket, gameData);

    roundOverHandler(io, socket, gameData, roomData);

    resetGameHandler(io, socket, gameData, gameStuckInterval);
  };

  // Define actions inside
  io.on("connection", onConnection);

  res.end();
}
