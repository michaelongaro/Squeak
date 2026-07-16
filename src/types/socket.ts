import type { IRoomConfig } from "~/types/room";
import type { ICard, IPlayerCards } from "~/utils/generateDeckAndSqueakCards";

export interface IFriendsData {
  [userID: string]: IFriendsMetadata;
}

export interface IFriendsMetadata {
  socketID: string;
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
  blacklistedSqueakCards: {
    [playerID: string]: IBlacklistedSqueakCards;
  };
  scoreboardMetadata: IScoreboardMetadata | null;
  currentVotes: ("agree" | "disagree")[];
  voteType: "rotateDecks" | "endRound" | null;
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
  cardBackVariant: string;
  deckHueRotation: number;
  botDifficulty?: "Easy" | "Medium" | "Hard" | "Expert";
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
    | "leaveRoom"
    | "removeFriend";
  initiatorID: string;
  targetID?: string;
  roomCode?: string;
  currentRoomIsPublic?: boolean;
  currentRoomIsFull?: boolean;
}

export interface ICardDropProposal {
  card: ICard;
  cardsInInitialPile: number;
  cardsInTargetPile: number;
  handStart?: boolean;
  squeakStackStartIndex?: number;
  boardEndLocation?: { row: number; col: number };
  squeakStackEndIndex?: number;
  gameData: IGameMetadata;
  playerID: string;
  roomCode: string;
}

export interface IDrawFromSqueakDeck {
  roomCode: string;
  indexToDrawTo: number;
  cardsInInitialPile: number;
  cardsInTargetPile: number;
  playerID: string;
  newCard?: ICard;
  gameData: IGameMetadata;
}

export interface IDrawFromDeck {
  cardBeingAnimated: ICard | null;
  cardsInInitialPile: number;
  cardsInTargetPile: number;
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
  scoreboardMetadata: IScoreboardMetadata | null;
}

export interface IScoreboardMetadata {
  gameWinnerID: string | null;
  roundWinnerID: string;
  playerRoundDetails: IPlayerRoundDetailsMetadata;
}

export interface IPlayerRoundDetailsMetadata {
  [playerID: string]: IPlayerRoundDetails;
}

export interface IPlayerRoundDetails {
  playerID: string;
  cardsPlayed: ICard[];
  squeakModifier: number;
  oldScore: number;
  newScore: number;
  oldRanking: number;
  newRanking: number;
}

export interface IPlayerRankings {
  [playerID: string]: number;
}
