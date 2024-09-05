import { createWithEqualityFn } from "zustand/traditional";
import { devtools } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { useAuth } from "@clerk/nextjs";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import useGetViewportLabel from "~/hooks/useGetViewportLabel";
import { type IRoomConfig } from "~/pages/create";
import {
  type IRoomPlayer,
  type IRoomPlayersMetadata,
  type IFriendsMetadata,
} from "../pages/api/socket";
import { type IGameMetadata } from "../pages/api/socket";
import { type IScoreboardMetadata } from "../pages/api/handlers/roundOverHandler";
// import { useUserIDContext } from "./UserIDContext";

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
  squeakStackDepthAlterations: number[]; // -2 means decreasing effective length of stack by 2 (allowing gaps between cards to expand)
  draggedStack?: DraggedStack;
}

export interface IInitSqueakStackCardBeingDealt {
  location: string;
  indexToDealTo: number;
}

interface StoreState {
  viewportLabel: "mobile" | "mobileLarge" | "tablet" | "desktop";
  setViewportLabel: (
    viewportLabel: "mobile" | "mobileLarge" | "tablet" | "desktop",
  ) => void;

  audioContext: AudioContext | null;
  setAudioContext: (audioContext: AudioContext | null) => void;
  masterVolumeGainNode: GainNode | null;
  setMasterVolumeGainNode: (masterVolumeGainNode: GainNode | null) => void;

  showSettingsDialog: boolean;
  setShowSettingsDialog: (showSettingsDialog: boolean) => void;
  showUserWasKickedDialog: boolean;
  setShowUserWasKickedDialog: (showUserWasKickedDialog: boolean) => void;

  roomConfig: IRoomConfig;
  setRoomConfig: (roomConfig: IRoomConfig) => void;
  playerMetadata: IRoomPlayersMetadata;
  setPlayerMetadata: (playerMetadata: IRoomPlayersMetadata) => void;
  gameData: IGameMetadata;
  setGameData: (gameData: IGameMetadata) => void;

  resetPlayerStateUponPageLoad: boolean;
  setResetPlayerStateUponPageLoad: (reset: boolean) => void;

  friendData: IFriendsMetadata | undefined;
  setFriendData: (friendData: IFriendsMetadata | undefined) => void;

  hoveredCell: [number, number] | null;
  setHoveredCell: (hoveredCell: [number, number] | null) => void;
  hoveredSqueakStack: number | null;
  setHoveredSqueakStack: (hoveredSqueakStack: number | null) => void;
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
  setProposedCardBoxShadow: (boxShadow: IProposedCardBoxShadow | null) => void;
  decksAreBeingRotated: boolean;
  setDecksAreBeingRotated: (rotated: boolean) => void;
  playerIDWhoSqueaked: string | null;
  setPlayerIDWhoSqueaked: (playerID: string | null) => void;
  showScoreboard: boolean;
  setShowScoreboard: (show: boolean) => void;
  showShufflingCountdown: boolean;
  setShowShufflingCountdown: (show: boolean) => void;
  connectedToRoom: boolean;
  setConnectedToRoom: (connected: boolean) => void;
  otherPlayerIDsDrawingFromDeck: string[];
  setOtherPlayerIDsDrawingFromDeck: (playerIDs: string[]) => void;

  currentVolume: number | null;
  setCurrentVolume: (volume: number | null) => void;
  deckVariantIndex: number;
  setDeckVariantIndex: (index: number) => void;

  cardBeingMovedProgramatically: ICardBeingMovedProgramatically;
  setCardBeingMovedProgramatically: (
    card: ICardBeingMovedProgramatically,
  ) => void;
  newInviteNotification: boolean;
  setNewInviteNotification: (notification: boolean) => void;
  mirrorPlayerContainer: boolean;
  setMirrorPlayerContainer: (mirror: boolean) => void;

  playerPing: number | null;
  setPlayerPing: (ping: number | null) => void;

  scoreboardMetadata: IScoreboardMetadata | null;
  setScoreboardMetadata: (metadata: IScoreboardMetadata | null) => void;
  squeakDeckBeingMovedProgramatically: ICardBeingMovedProgramatically;
  setSqueakDeckBeingMovedProgramatically: (
    deck: ICardBeingMovedProgramatically,
  ) => void;
  squeakStackDragAlterations: {
    [playerID: string]: SqueakStackDragAlterations;
  };
  setSqueakStackDragAlterations: (alterations: {
    [playerID: string]: SqueakStackDragAlterations;
  }) => void;

  // related to voting
  currentVotes: ("agree" | "disagree")[];
  setCurrentVotes: (votes: ("agree" | "disagree")[]) => void;
  voteType: "rotateDecks" | "finishRound" | null;
  setVoteType: (type: "rotateDecks" | "finishRound" | null) => void;
  votingIsLockedOut: boolean;
  setVotingIsLockedOut: (lockedOut: boolean) => void;
  showVotingDialog: boolean;
  setShowVotingDialog: (show: boolean) => void;
  passiveVoteResolutionTimerId: NodeJS.Timeout | undefined;
  setPassiveVoteResolutionTimerId: (
    timerId: NodeJS.Timeout | undefined,
  ) => void;
  votingLockoutStartTimestamp: number | null;
  setVotingLockoutStartTimestamp: (timestamp: number | null) => void;
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: (show: boolean) => void;

  // audio file buffers
  successfulMoveBuffer: AudioBuffer | null;
  notAllowedMoveBuffer: AudioBuffer | null;
  otherPlayerCardMoveBuffer: AudioBuffer | null;
  squeakButtonPressBuffer: AudioBuffer | null;
  confettiPopBuffer: AudioBuffer | null;

  setSuccessfulMoveBuffer: (buffer: AudioBuffer) => void;
  setNotAllowedMoveBuffer: (buffer: AudioBuffer) => void;
  setOtherPlayerCardMoveBuffer: (buffer: AudioBuffer) => void;
  setSqueakButtonPressBuffer: (buffer: AudioBuffer) => void;
  setConfettiPopBuffer: (buffer: AudioBuffer) => void;
}

export const useMainStore = createWithEqualityFn<StoreState>()(
  devtools(
    (set, get) => ({
      viewportLabel: "mobile",
      setViewportLabel: (viewportLabel) => set({ viewportLabel }),
      audioContext: null,
      setAudioContext: (audioContext) => set({ audioContext }),

      masterVolumeGainNode: null,
      setMasterVolumeGainNode: (masterVolumeGainNode) =>
        set({ masterVolumeGainNode }),

      successfulMoveBuffer: null,
      notAllowedMoveBuffer: null,
      otherPlayerCardMoveBuffer: null,
      squeakButtonPressBuffer: null,
      confettiPopBuffer: null,

      setSuccessfulMoveBuffer: (buffer) =>
        set({ successfulMoveBuffer: buffer }),
      setNotAllowedMoveBuffer: (buffer) =>
        set({ notAllowedMoveBuffer: buffer }),
      setOtherPlayerCardMoveBuffer: (buffer) =>
        set({ otherPlayerCardMoveBuffer: buffer }),
      setSqueakButtonPressBuffer: (buffer) =>
        set({ squeakButtonPressBuffer: buffer }),
      setConfettiPopBuffer: (buffer) => set({ confettiPopBuffer: buffer }),

      currentVolume: null,
      setCurrentVolume: (volume) => set({ currentVolume: volume }),

      deckVariantIndex: 0,
      setDeckVariantIndex: (index) => set({ deckVariantIndex: index }),

      showSettingsDialog: false,
      setShowSettingsDialog: (showSettingsDialog) =>
        set({ showSettingsDialog }),

      showUserWasKickedDialog: false,
      setShowUserWasKickedDialog: (showUserWasKickedDialog) =>
        set({ showUserWasKickedDialog }),

      roomConfig: {
        pointsToWin: 100,
        maxPlayers: 2,
        playersInRoom: 1,
        playerIDsInRoom: [], // You need to set this to initial state value
        isPublic: true,
        code: "",
        hostUsername: "",
        hostUserID: "",
        gameStarted: false,
      },
      setRoomConfig: (roomConfig) => set({ roomConfig }),

      playerMetadata: {} as IRoomPlayersMetadata, // Make sure to initialize this properly
      setPlayerMetadata: (playerMetadata) => set({ playerMetadata }),

      mirrorPlayerContainer: false,
      setMirrorPlayerContainer: (mirror) =>
        set({ mirrorPlayerContainer: mirror }),

      gameData: {} as IGameMetadata, // Make sure to initialize this properly
      setGameData: (gameData) => set({ gameData }),

      resetPlayerStateUponPageLoad: false,
      setResetPlayerStateUponPageLoad: (reset) =>
        set({ resetPlayerStateUponPageLoad: reset }),

      friendData: undefined,
      setFriendData: (friendData) => set({ friendData }),

      hoveredCell: null,
      setHoveredCell: (hoveredCell) => set({ hoveredCell }),

      hoveredSqueakStack: null,
      setHoveredSqueakStack: (hoveredSqueakStack) =>
        set({ hoveredSqueakStack }),

      holdingADeckCard: false,
      setHoldingADeckCard: (holding) => set({ holdingADeckCard: holding }),

      holdingASqueakCard: false,
      setHoldingASqueakCard: (holding) => set({ holdingASqueakCard: holding }),

      originIndexForHeldSqueakCard: null,
      setOriginIndexForHeldSqueakCard: (index) =>
        set({ originIndexForHeldSqueakCard: index }),

      heldSqueakStackLocation: null,
      setHeldSqueakStackLocation: (location) =>
        set({ heldSqueakStackLocation: location }),

      proposedCardBoxShadow: null,
      setProposedCardBoxShadow: (boxShadow) =>
        set({ proposedCardBoxShadow: boxShadow }),

      decksAreBeingRotated: false,
      setDecksAreBeingRotated: (rotated) =>
        set({ decksAreBeingRotated: rotated }),

      playerIDWhoSqueaked: null,
      setPlayerIDWhoSqueaked: (playerID) =>
        set({ playerIDWhoSqueaked: playerID }),

      connectedToRoom: false,
      setConnectedToRoom: (connected) => set({ connectedToRoom: connected }),

      otherPlayerIDsDrawingFromDeck: [],
      setOtherPlayerIDsDrawingFromDeck: (playerIDs) =>
        set({ otherPlayerIDsDrawingFromDeck: playerIDs }),

      showScoreboard: false,
      setShowScoreboard: (show) => set({ showScoreboard: show }),

      showShufflingCountdown: false,
      setShowShufflingCountdown: (show) =>
        set({ showShufflingCountdown: show }),

      playerPing: 0, // Or null if not connected
      setPlayerPing: (ping) => set({ playerPing: ping }),

      scoreboardMetadata: null,
      setScoreboardMetadata: (metadata) =>
        set({ scoreboardMetadata: metadata }),

      cardBeingMovedProgramatically: {} as ICardBeingMovedProgramatically,
      setCardBeingMovedProgramatically: (card) =>
        set({ cardBeingMovedProgramatically: card }),

      squeakDeckBeingMovedProgramatically: {} as ICardBeingMovedProgramatically,
      setSqueakDeckBeingMovedProgramatically: (deck) =>
        set({ squeakDeckBeingMovedProgramatically: deck }),

      newInviteNotification: false,
      setNewInviteNotification: (notification) =>
        set({ newInviteNotification: notification }),

      squeakStackDragAlterations: {}, // Initialize with a proper empty object structure
      setSqueakStackDragAlterations: (alterations) =>
        set({ squeakStackDragAlterations: alterations }),

      currentVotes: [],
      setCurrentVotes: (votes) => set({ currentVotes: votes }),

      voteType: null,
      setVoteType: (type) => set({ voteType: type }),

      votingIsLockedOut: false,
      setVotingIsLockedOut: (lockedOut) =>
        set({ votingIsLockedOut: lockedOut }),

      showVotingDialog: false,
      setShowVotingDialog: (show) => set({ showVotingDialog: show }),

      passiveVoteResolutionTimerId: undefined,
      setPassiveVoteResolutionTimerId: (timerId) =>
        set({ passiveVoteResolutionTimerId: timerId }),

      votingLockoutStartTimestamp: null,
      setVotingLockoutStartTimestamp: (timestamp) =>
        set({ votingLockoutStartTimestamp: timestamp }),

      showVotingOptionButtons: true,
      setShowVotingOptionButtons: (show) =>
        set({ showVotingOptionButtons: show }),
    }),
    shallow,
  ),
);
