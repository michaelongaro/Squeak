import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { type IRoomConfig } from "~/pages/create";
import {
  type IFriendsMetadata,
  type IGameMetadata,
  type IRoomPlayersMetadata,
} from "../pages/api/socket";
import { type IScoreboardMetadata } from "../pages/api/handlers/roundOverHandler";

// Define interfaces
interface IHeldSqueakStackLocation {
  [playerID: string]: {
    squeakStack: [number, number];
    location: { x: number; y: number };
  } | null;
}

interface IProposedCardBoxShadow {
  id: string;
  boxShadowValue: string;
}

interface ICardBeingMovedProgramatically {
  [playerID: string]: boolean;
}

interface DraggedStack {
  squeakStackIdx: number;
  startingDepth: number;
  length: number;
  lengthOfTargetStack: number;
}

interface SqueakStackDragAlterations {
  squeakStackDepthAlterations: number[];
  draggedStack?: DraggedStack;
}

export interface IInitSqueakStackCardBeingDealt {
  location: string;
  indexToDealTo: number;
}

export interface IQueuedCard {
  [key: string]: {
    value: string;
    suit: string;
  };
}

// Store state interface
interface StoreState {
  viewportLabel: "mobile" | "mobileLarge" | "tablet" | "desktop";
  audioContext: AudioContext | null;
  setAudioContext: (context: AudioContext | null) => void;
  masterVolumeGainNode: GainNode | null;
  setMasterVolumeGainNode: (node: GainNode | null) => void;
  successfulMoveBuffer: AudioBuffer | null;
  setSuccessfulMoveBuffer: (buffer: AudioBuffer | null) => void;
  notAllowedMoveBuffer: AudioBuffer | null;
  setNotAllowedMoveBuffer: (buffer: AudioBuffer | null) => void;
  otherPlayerCardMoveBuffer: AudioBuffer | null;
  setOtherPlayerCardMoveBuffer: (buffer: AudioBuffer | null) => void;
  squeakButtonPressBuffer: AudioBuffer | null;
  setSqueakButtonPressBuffer: (buffer: AudioBuffer | null) => void;
  confettiPopBuffer: AudioBuffer | null;
  setConfettiPopBuffer: (buffer: AudioBuffer | null) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (value: boolean) => void;
  roomConfig: IRoomConfig;
  setRoomConfig: (config: IRoomConfig) => void;
  playerMetadata: IRoomPlayersMetadata;
  setPlayerMetadata: (metadata: IRoomPlayersMetadata) => void;
  gameData: IGameMetadata;
  setGameData: (data: IGameMetadata) => void;
  friendData: IFriendsMetadata | undefined;
  setFriendData: (data: IFriendsMetadata | undefined) => void;
  queuedCards: IQueuedCard;
  setQueuedCards: (cards: IQueuedCard) => void;
  hoveredCell: [number, number] | null;
  setHoveredCell: (cell: [number, number] | null) => void;
  hoveredSqueakStack: number | null;
  setHoveredSqueakStack: (stack: number | null) => void;
  holdingADeckCard: boolean;
  setHoldingADeckCard: (holding: boolean) => void;
  holdingASqueakCard: boolean;
  setHoldingASqueakCard: (holding: boolean) => void;
  originIndexForHeldSqueakCard: number | null;
  setOriginIndexForHeldSqueakCard: (index: number | null) => void;
  heldSqueakStackLocation: IHeldSqueakStackLocation | null;
  setHeldSqueakStackLocation: (
    location: IHeldSqueakStackLocation | null,
  ) => void;
  proposedCardBoxShadow: IProposedCardBoxShadow | null;
  setProposedCardBoxShadow: (shadow: IProposedCardBoxShadow | null) => void;
  decksAreBeingRotated: boolean;
  setDecksAreBeingRotated: (rotated: boolean) => void;
  playerIDWhoSqueaked: string | null;
  setPlayerIDWhoSqueaked: (id: string | null) => void;
  showScoreboard: boolean;
  setShowScoreboard: (show: boolean) => void;
  showShufflingCountdown: boolean;
  setShowShufflingCountdown: (show: boolean) => void;
  connectedToRoom: boolean;
  setConnectedToRoom: (connected: boolean) => void;
  currentVolume: number | null;
  setCurrentVolume: (volume: number | null) => void;
  prefersSimpleCardAssets: boolean | null;
  setPrefersSimpleCardAssets: (prefers: boolean | null) => void;
  cardBeingMovedProgramatically: ICardBeingMovedProgramatically;
  setCardBeingMovedProgramatically: (
    cards: ICardBeingMovedProgramatically,
  ) => void;
  newInviteNotification: boolean;
  setNewInviteNotification: (notify: boolean) => void;
  mirrorPlayerContainer: boolean;
  setMirrorPlayerContainer: (mirror: boolean) => void;
  scoreboardMetadata: IScoreboardMetadata | null;
  setScoreboardMetadata: (metadata: IScoreboardMetadata | null) => void;
  squeakDeckBeingMovedProgramatically: ICardBeingMovedProgramatically;
  setSqueakDeckBeingMovedProgramatically: (
    cards: ICardBeingMovedProgramatically,
  ) => void;
  squeakStackDragAlterations: {
    [playerID: string]: SqueakStackDragAlterations;
  };
  setOtherPlayerSqueakStacksBeingDragged: (alterations: {
    [playerID: string]: SqueakStackDragAlterations;
  }) => void;
  smallerViewportCardBeingMoved: {
    [playerID: string]: string | null;
  };
  setSmallerViewportCardBeingMoved: (cards: {
    [playerID: string]: string | null;
  }) => void;
  currentVotes: ("agree" | "disagree")[];
  setCurrentVotes: (votes: ("agree" | "disagree")[]) => void;
  voteType: "rotateDecks" | "finishRound" | null;
  setVoteType: (type: "rotateDecks" | "finishRound" | null) => void;
  votingIsLockedOut: boolean;
  setVotingIsLockedOut: (locked: boolean) => void;
  showVotingModal: boolean;
  setShowVotingModal: (show: boolean) => void;
  passiveVoteResolutionTimerId: NodeJS.Timeout | undefined;
  setPassiveVoteResolutionTimerId: (id: NodeJS.Timeout | undefined) => void;
  votingLockoutStartTimestamp: number | null;
  setVotingLockoutStartTimestamp: (timestamp: number | null) => void;
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: (show: boolean) => void;
}

const initialRoomConfig: IRoomConfig = {
  pointsToWin: 100,
  maxPlayers: 2,
  playersInRoom: 1,
  playerIDsInRoom: [],
  isPublic: true,
  code: "",
  hostUsername: "",
  hostUserID: "",
  gameStarted: false,
};

const initialState: StoreState = {
  viewportLabel: "desktop",
  audioContext: null,
  setAudioContext: () => {},
  masterVolumeGainNode: null,
  setMasterVolumeGainNode: () => {},
  successfulMoveBuffer: null,
  setSuccessfulMoveBuffer: () => {},
  notAllowedMoveBuffer: null,
  setNotAllowedMoveBuffer: () => {},
  otherPlayerCardMoveBuffer: null,
  setOtherPlayerCardMoveBuffer: () => {},
  squeakButtonPressBuffer: null,
  setSqueakButtonPressBuffer: () => {},
  confettiPopBuffer: null,
  setConfettiPopBuffer: () => {},
  showSettingsModal: false,
  setShowSettingsModal: () => {},
  roomConfig: initialRoomConfig,
  setRoomConfig: () => {},
  playerMetadata: {} as IRoomPlayersMetadata,
  setPlayerMetadata: () => {},
  gameData: {} as IGameMetadata,
  setGameData: () => {},
  friendData: undefined,
  setFriendData: () => {},
  queuedCards: {},
  setQueuedCards: () => {},
  hoveredCell: null,
  setHoveredCell: () => {},
  hoveredSqueakStack: null,
  setHoveredSqueakStack: () => {},
  holdingADeckCard: false,
  setHoldingADeckCard: () => {},
  holdingASqueakCard: false,
  setHoldingASqueakCard: () => {},
  originIndexForHeldSqueakCard: null,
  setOriginIndexForHeldSqueakCard: () => {},
  heldSqueakStackLocation: null,
  setHeldSqueakStackLocation: () => {},
  proposedCardBoxShadow: null,
  setProposedCardBoxShadow: () => {},
  decksAreBeingRotated: false,
  setDecksAreBeingRotated: () => {},
  playerIDWhoSqueaked: null,
  setPlayerIDWhoSqueaked: () => {},
  showScoreboard: false,
  setShowScoreboard: () => {},
  showShufflingCountdown: false,
  setShowShufflingCountdown: () => {},
  connectedToRoom: false,
  setConnectedToRoom: () => {},
  currentVolume: null,
  setCurrentVolume: () => {},
  prefersSimpleCardAssets: null,
  setPrefersSimpleCardAssets: () => {},
  cardBeingMovedProgramatically: {},
  setCardBeingMovedProgramatically: () => {},
  newInviteNotification: false,
  setNewInviteNotification: () => {},
  mirrorPlayerContainer: false,
  setMirrorPlayerContainer: () => {},
  scoreboardMetadata: null,
  setScoreboardMetadata: () => {},
  squeakDeckBeingMovedProgramatically: {},
  setSqueakDeckBeingMovedProgramatically: () => {},
  squeakStackDragAlterations: {},
  setOtherPlayerSqueakStacksBeingDragged: () => {},
  smallerViewportCardBeingMoved: {},
  setSmallerViewportCardBeingMoved: () => {},
  currentVotes: [],
  setCurrentVotes: () => {},
  voteType: null,
  setVoteType: () => {},
  votingIsLockedOut: false,
  setVotingIsLockedOut: () => {},
  showVotingModal: false,
  setShowVotingModal: () => {},
  passiveVoteResolutionTimerId: undefined,
  setPassiveVoteResolutionTimerId: () => {},
  votingLockoutStartTimestamp: null,
  setVotingLockoutStartTimestamp: () => {},
  showVotingOptionButtons: true,
  setShowVotingOptionButtons: () => {},
};

export const useMainStore = create<StoreState>()(
  devtools(
    (set) => ({
      ...initialState,
      setAudioContext: (context) => set({ audioContext: context }),
      setMasterVolumeGainNode: (node) => set({ masterVolumeGainNode: node }),
      setSuccessfulMoveBuffer: (buffer) =>
        set({ successfulMoveBuffer: buffer }),
      setNotAllowedMoveBuffer: (buffer) =>
        set({ notAllowedMoveBuffer: buffer }),
      setOtherPlayerCardMoveBuffer: (buffer) =>
        set({ otherPlayerCardMoveBuffer: buffer }),
      setSqueakButtonPressBuffer: (buffer) =>
        set({ squeakButtonPressBuffer: buffer }),
      setConfettiPopBuffer: (buffer) => set({ confettiPopBuffer: buffer }),
      setShowSettingsModal: (value) => set({ showSettingsModal: value }),
      setRoomConfig: (config) => set({ roomConfig: config }),
      setPlayerMetadata: (metadata) => set({ playerMetadata: metadata }),
      setGameData: (data) => set({ gameData: data }),
      setFriendData: (data) => set({ friendData: data }),
      setQueuedCards: (cards) => set({ queuedCards: cards }),
      setHoveredCell: (cell) => set({ hoveredCell: cell }),
      setHoveredSqueakStack: (stack) => set({ hoveredSqueakStack: stack }),
      setHoldingADeckCard: (holding) => set({ holdingADeckCard: holding }),
      setHoldingASqueakCard: (holding) => set({ holdingASqueakCard: holding }),
      setOriginIndexForHeldSqueakCard: (index) =>
        set({ originIndexForHeldSqueakCard: index }),
      setHeldSqueakStackLocation: (location) =>
        set({ heldSqueakStackLocation: location }),
      setProposedCardBoxShadow: (shadow) =>
        set({ proposedCardBoxShadow: shadow }),
      setDecksAreBeingRotated: (rotated) =>
        set({ decksAreBeingRotated: rotated }),
      setPlayerIDWhoSqueaked: (id) => set({ playerIDWhoSqueaked: id }),
      setShowScoreboard: (show) => set({ showScoreboard: show }),
      setShowShufflingCountdown: (show) =>
        set({ showShufflingCountdown: show }),
      setConnectedToRoom: (connected) => set({ connectedToRoom: connected }),
      setCurrentVolume: (volume) => set({ currentVolume: volume }),
      setPrefersSimpleCardAssets: (prefers) =>
        set({ prefersSimpleCardAssets: prefers }),
      setCardBeingMovedProgramatically: (cards) =>
        set({ cardBeingMovedProgramatically: cards }),
      setNewInviteNotification: (notify) =>
        set({ newInviteNotification: notify }),
      setMirrorPlayerContainer: (mirror) =>
        set({ mirrorPlayerContainer: mirror }),
      setScoreboardMetadata: (metadata) =>
        set({ scoreboardMetadata: metadata }),
      setSqueakDeckBeingMovedProgramatically: (cards) =>
        set({ squeakDeckBeingMovedProgramatically: cards }),
      setOtherPlayerSqueakStacksBeingDragged: (alterations) =>
        set({ squeakStackDragAlterations: alterations }),
      setSmallerViewportCardBeingMoved: (cards) =>
        set({ smallerViewportCardBeingMoved: cards }),
      setCurrentVotes: (votes) => set({ currentVotes: votes }),
      setVoteType: (type) => set({ voteType: type }),
      setVotingIsLockedOut: (locked) => set({ votingIsLockedOut: locked }),
      setShowVotingModal: (show) => set({ showVotingModal: show }),
      setPassiveVoteResolutionTimerId: (id) =>
        set({ passiveVoteResolutionTimerId: id }),
      setVotingLockoutStartTimestamp: (timestamp) =>
        set({ votingLockoutStartTimestamp: timestamp }),
      setShowVotingOptionButtons: (show) =>
        set({ showVotingOptionButtons: show }),
    }),
    shallow,
  ),
);
