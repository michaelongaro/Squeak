import { Server, type Socket } from "socket.io";
import { type IRoomConfig } from "../create";
import {
  type IPlayerCards,
  type ICard,
} from "../../utils/generateDeckAndSqueakCards";
import { drawFromDeckHandler } from "./handlers/drawFromDeckHandler";
import { proposedCardDropHandler } from "./handlers/proposedCardDropHandler";
import { roundOverHandler } from "./handlers/roundOverHandler";
import { resetGameHandler } from "./handlers/resetGameHandler";
import { leaveRoomHandler } from "./handlers/leaveRoomHandler";
import { initializePlayerInFriendsObject } from "./handlers/initializePlayerInFriendsObject";
import { modifyFriendDataHandler } from "./handlers/modifyFriendDataHandler";
import { updateRoomConfigHandler } from "./handlers/updateRoomConfigHandler";
import { startGameHandler } from "./handlers/startGameHandler";
import { createRoomHandler } from "./handlers/createRoomHandler";
import { joinRoomHandler } from "./handlers/joinRoomHandler";
import { updatePlayerMetadataHandler } from "./handlers/updatePlayerMetadataHandler";
import { castVoteHandler } from "./handlers/castVoteHandler";
import { rejoinRoomHandler } from "./handlers/rejoinRoomHandler";
import { oldRoomCleanupCron } from "~/pages/api/handlers/oldRoomCleanupCron";

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
  boardTimestamps: number[][];
  preventOtherPlayersFromSqueaking: boolean;
  botIntervals: NodeJS.Timeout[];

  // used to keep track of squeak cards that have been moved to other squeak cards so that
  // we don't move them back to the same squeak card infinitely. When a squeak card is moved
  // onto the board the key-value pair will be deleted from this object.
  // key: stringified card that was moved
  // value: stringified card that it was moved to
  // ^^ could have another reversed obj for easier lookup, but only do if ergonomics are worth it
  blacklistedSqueakCards: {
    [playerID: string]: IBlacklistedSqueakCards;
  };

  // related to voting
  currentVotes: ("agree" | "disagree")[];
  voteType: "rotateDecks" | "finishRound" | null;
}

interface IBlacklistedSqueakCards {
  [stringifiedCard: string]: string;
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
  botDifficulty?: "Easy" | "Medium" | "Hard";
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
  gameData: IGameMetadata;
  playerID: string;
  roomCode: string;
}

export interface IDrawFromSqueakDeck {
  roomCode: string;
  indexToDrawTo: number;
  playerID: string;
  newCard?: ICard;
  gameData: IGameMetadata;
}

export interface IDrawFromDeck {
  cardBeingAnimated: ICard | null; // this will be the (up to) third top card from deck being drawn
  resetDeck?: boolean;
  playerID: string;
  roomCode: string;
  gameData: IGameMetadata;
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
  playerWasKicked: boolean;
}

export interface IRejoinData {
  userID: string;
  roomConfig: IRoomConfig;
  players: IRoomPlayersMetadata;
  gameData: IGameMetadata;
}

const roomData: IRoomData = {};
const gameData: IGameData = {};
const friendsData: IFriendsData = {};
const miscRoomData: IMiscRoomData = {};

// unsure of if this is necessary
export const config = {
  api: {
    externalResolver: true,
  },
};

// @ts-expect-error sdf
export default function SocketHandler(req, res) {
  // means that socket server was already initialized
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: "/api/socket",
  });
  res.socket.server.io = io;

  const onConnection = (socket: Socket) => {
    // pregame/room handlers
    createRoomHandler(io, socket, roomData, miscRoomData);

    joinRoomHandler(io, socket, roomData);

    updateRoomConfigHandler(io, socket, roomData);

    updatePlayerMetadataHandler(io, socket, roomData);

    startGameHandler(io, socket, roomData, gameData, miscRoomData);

    // game/room handlers
    drawFromDeckHandler(io, socket, gameData);

    proposedCardDropHandler(io, socket, gameData, miscRoomData);

    roundOverHandler(io, socket, gameData, roomData, miscRoomData);

    resetGameHandler(io, socket, gameData, roomData, miscRoomData);

    leaveRoomHandler(io, socket, gameData, roomData, miscRoomData);

    castVoteHandler(io, socket, gameData, miscRoomData, roomData);

    rejoinRoomHandler(io, socket, gameData, roomData);

    oldRoomCleanupCron(io, socket, gameData, roomData, miscRoomData);

    socket.on("directlyLeaveRoom", (roomCode) => {
      socket.leave(roomCode);
    });

    // friends handlers
    initializePlayerInFriendsObject(io, socket, friendsData);

    modifyFriendDataHandler(io, socket, friendsData);
  };

  io.on("connection", onConnection);

  res.end();
}
