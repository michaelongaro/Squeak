import { Server, type Socket } from "socket.io";
import { type IRoomConfig } from "../../components/CreateRoom/CreateRoom";
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
import { voteReceivedHandler } from "./handlers/voteReceivedHandler";

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
  updatedGameData: IGameMetadata;
  playerID: string;
  roomCode: string;
}

export interface IDrawFromSqueakDeck {
  roomCode: string;
  indexToDrawTo: number;
  playerID: string;
  newCard?: ICard;
  updatedGameData: IGameMetadata;
}

export interface IDrawFromDeck {
  nextTopCardInDeck: ICard | null;
  resetDeck?: boolean;
  topCardsInDeck: (ICard | null)[];
  playerID: string;
  roomCode: string;
  updatedGameData: IGameMetadata;
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

    voteReceivedHandler(io, socket, gameData, miscRoomData, roomData);

    socket.on("directlyLeaveRoom", (roomCode) => {
      socket.leave(roomCode);
    });

    // TODO: automatic server side disconnecting of socket from room is theoretically possible
    // assuming that the socket.id is stable, if it is then we could add a property onto the
    // miscRoomData object that has key of roomCode and value of socket.id and playerID.
    // but to be honest this approach seems flaky at best...

    // socket.on("disconnecting", (reason) => {
    //   console.log(reason);
    //   console.dir(socket.rooms);
    //   for (const room of socket.rooms) {
    //     if (room !== socket.id) {
    //       // socket.to(room).emit("user has left", socket.id);
    //       console.log("disconnecting", socket.id, "from", room);
    //     }
    //   }
    // });

    // friends handlers
    initializePlayerInFriendsObject(io, socket, friendsData);

    modifyFriendDataHandler(io, socket, friendsData);
  };

  io.on("connection", onConnection);

  res.end();
}
