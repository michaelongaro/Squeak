import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { socket } from "~/pages/_app";
import { useAuth } from "@clerk/nextjs";
import { type IRoomConfig } from "~/pages/create";
import {
  type IRoomPlayer,
  type IRoomPlayersMetadata,
  type IFriendsMetadata,
} from "../pages/api/socket";
import { type IGameMetadata } from "../pages/api/socket";
import { type IScoreboardMetadata } from "../pages/api/handlers/roundOverHandler";
import { useUserIDContext } from "./UserIDContext";
import { api } from "~/utils/api";
import useGetViewportLabel from "~/hooks/useGetViewportLabel";

export interface IHeldSqueakStackLocation {
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

interface IRoomContext {
  viewportLabel: "mobile" | "mobileLarge" | "tablet" | "desktop";

  audioContext: AudioContext | null;
  setAudioContext: React.Dispatch<React.SetStateAction<AudioContext | null>>;
  masterVolumeGainNode: GainNode | null;
  setMasterVolumeGainNode: React.Dispatch<
    React.SetStateAction<GainNode | null>
  >;

  showSettingsDialog: boolean;
  setShowSettingsDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showUserWasKickedDialog: boolean;
  setShowUserWasKickedDialog: React.Dispatch<React.SetStateAction<boolean>>;

  roomConfig: IRoomConfig;
  setRoomConfig: React.Dispatch<React.SetStateAction<IRoomConfig>>;
  playerMetadata: IRoomPlayersMetadata;
  setPlayerMetadata: React.Dispatch<React.SetStateAction<IRoomPlayersMetadata>>;
  gameData: IGameMetadata;
  setGameData: React.Dispatch<React.SetStateAction<IGameMetadata>>;

  resetPlayerStateUponPageLoad: boolean;
  setResetPlayerStateUponPageLoad: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  friendData: IFriendsMetadata | undefined;
  setFriendData: React.Dispatch<
    React.SetStateAction<IFriendsMetadata | undefined>
  >;

  hoveredCell: [number, number] | null;
  setHoveredCell: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  hoveredSqueakStack: number | null;
  setHoveredSqueakStack: React.Dispatch<React.SetStateAction<number | null>>;
  holdingADeckCard: boolean;
  setHoldingADeckCard: React.Dispatch<React.SetStateAction<boolean>>;
  holdingASqueakCard: boolean;
  setHoldingASqueakCard: React.Dispatch<React.SetStateAction<boolean>>;
  originIndexForHeldSqueakCard: number | null;
  setOriginIndexForHeldSqueakCard: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  heldSqueakStackLocation: IHeldSqueakStackLocation | null;
  setHeldSqueakStackLocation: React.Dispatch<
    React.SetStateAction<IHeldSqueakStackLocation | null>
  >;
  proposedCardBoxShadow: IProposedCardBoxShadow | null;
  setProposedCardBoxShadow: React.Dispatch<
    React.SetStateAction<IProposedCardBoxShadow | null>
  >;
  decksAreBeingRotated: boolean;
  setDecksAreBeingRotated: React.Dispatch<React.SetStateAction<boolean>>;
  playerIDWhoSqueaked: string | null;
  setPlayerIDWhoSqueaked: React.Dispatch<React.SetStateAction<string | null>>;
  showScoreboard: boolean;
  setShowScoreboard: React.Dispatch<React.SetStateAction<boolean>>;
  showShufflingCountdown: boolean;
  setShowShufflingCountdown: React.Dispatch<React.SetStateAction<boolean>>;
  connectedToRoom: boolean;
  setConnectedToRoom: React.Dispatch<React.SetStateAction<boolean>>;
  otherPlayerIDsDrawingFromDeck: string[];
  setOtherPlayerIDsDrawingFromDeck: React.Dispatch<
    React.SetStateAction<string[]>
  >;
  currentPlayerIsDrawingFromDeck: boolean;
  setCurrentPlayerIsDrawingFromDeck: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  fallbackPlayerIsDrawingFromDeckTimerIdRef: React.MutableRefObject<
    NodeJS.Timeout | undefined
  >;

  currentVolume: number | null;
  setCurrentVolume: React.Dispatch<React.SetStateAction<number | null>>;
  deckVariantIndex: number;
  setDeckVariantIndex: React.Dispatch<React.SetStateAction<number>>;

  cardBeingMovedProgramatically: ICardBeingMovedProgramatically;
  setCardBeingMovedProgramatically: React.Dispatch<
    React.SetStateAction<ICardBeingMovedProgramatically>
  >;
  newInviteNotification: boolean;
  setNewInviteNotification: React.Dispatch<React.SetStateAction<boolean>>;
  mirrorPlayerContainer: boolean;
  setMirrorPlayerContainer: React.Dispatch<React.SetStateAction<boolean>>;

  playerPing: number | null;
  setPlayerPing: React.Dispatch<React.SetStateAction<number | null>>;

  scoreboardMetadata: IScoreboardMetadata | null;
  setScoreboardMetadata: React.Dispatch<
    React.SetStateAction<IScoreboardMetadata | null>
  >;
  squeakDeckBeingMovedProgramatically: ICardBeingMovedProgramatically;
  setSqueakDeckBeingMovedProgramatically: React.Dispatch<
    React.SetStateAction<ICardBeingMovedProgramatically>
  >;
  squeakStackDragAlterations: {
    [playerID: string]: SqueakStackDragAlterations;
  };
  setSqueakStackDragAlterations: React.Dispatch<
    React.SetStateAction<{
      [playerID: string]: SqueakStackDragAlterations;
    }>
  >;

  // related to voting
  currentVotes: ("agree" | "disagree")[];
  setCurrentVotes: React.Dispatch<
    React.SetStateAction<("agree" | "disagree")[]>
  >;
  voteType: "rotateDecks" | "finishRound" | null;
  setVoteType: React.Dispatch<
    React.SetStateAction<"rotateDecks" | "finishRound" | null>
  >;
  votingIsLockedOut: boolean;
  setVotingIsLockedOut: React.Dispatch<React.SetStateAction<boolean>>;
  showVotingDialog: boolean;
  setShowVotingDialog: React.Dispatch<React.SetStateAction<boolean>>;
  passiveVoteResolutionTimerId: NodeJS.Timeout | undefined;
  setPassiveVoteResolutionTimerId: React.Dispatch<
    React.SetStateAction<NodeJS.Timeout | undefined>
  >;
  votingLockoutStartTimestamp: number | null;
  setVotingLockoutStartTimestamp: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: React.Dispatch<React.SetStateAction<boolean>>;

  // audio file buffers
  successfulMoveBuffer: AudioBuffer | null;
  notAllowedMoveBuffer: AudioBuffer | null;
  otherPlayerCardMoveBuffer: AudioBuffer | null;
  squeakButtonPressBuffer: AudioBuffer | null;
  confettiPopBuffer: AudioBuffer | null;
}

const RoomContext = createContext<IRoomContext | null>(null);

export function RoomProvider(props: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const userID = useUserIDContext();

  const { data: user } = api.users.getUserByID.useQuery(userID, {
    enabled: isSignedIn && userID !== "",
  });

  const viewportLabel = useGetViewportLabel();

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [masterVolumeGainNode, setMasterVolumeGainNode] =
    useState<GainNode | null>(null);

  const [successfulMoveBuffer, setSuccessfulMoveBuffer] =
    useState<AudioBuffer | null>(null);
  const [notAllowedMoveBuffer, setNotAllowedMoveBuffer] =
    useState<AudioBuffer | null>(null);
  const [otherPlayerCardMoveBuffer, setOtherPlayerCardMoveBuffer] =
    useState<AudioBuffer | null>(null);
  const [squeakButtonPressBuffer, setSqueakButtonPressBuffer] =
    useState<AudioBuffer | null>(null);
  const [confettiPopBuffer, setConfettiPopBuffer] =
    useState<AudioBuffer | null>(null);

  const [currentVolume, setCurrentVolume] = useState<number | null>(null);
  const [deckVariantIndex, setDeckVariantIndex] = useState<number>(0);

  const [showSettingsDialog, setShowSettingsDialog] = useState<boolean>(false);
  const [showUserWasKickedDialog, setShowUserWasKickedDialog] =
    useState<boolean>(false);

  const [roomConfig, setRoomConfig] = useState<IRoomConfig>({
    pointsToWin: 100,
    maxPlayers: 2,
    playersInRoom: 1,
    playerIDsInRoom: [userID],
    isPublic: true,
    code: "",
    hostUsername: "",
    hostUserID: "",
    gameStarted: false,
  });
  const [playerMetadata, setPlayerMetadata] = useState<IRoomPlayersMetadata>(
    {} as IRoomPlayersMetadata,
  );

  const [mirrorPlayerContainer, setMirrorPlayerContainer] =
    useState<boolean>(false);

  // safe, because we are only ever accessing/mutating gameData when it is defined
  const [gameData, setGameData] = useState<IGameMetadata>({} as IGameMetadata);

  const [resetPlayerStateUponPageLoad, setResetPlayerStateUponPageLoad] =
    useState<boolean>(false);

  const [friendData, setFriendData] = useState<IFriendsMetadata | undefined>();

  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [hoveredSqueakStack, setHoveredSqueakStack] = useState<number | null>(
    null,
  );
  const [holdingADeckCard, setHoldingADeckCard] = useState<boolean>(false);
  const [holdingASqueakCard, setHoldingASqueakCard] = useState<boolean>(false);
  const [originIndexForHeldSqueakCard, setOriginIndexForHeldSqueakCard] =
    useState<number | null>(null);

  const [heldSqueakStackLocation, setHeldSqueakStackLocation] =
    useState<IHeldSqueakStackLocation | null>(null);

  const [proposedCardBoxShadow, setProposedCardBoxShadow] =
    useState<IProposedCardBoxShadow | null>(null);

  const [currentPlayerIsDrawingFromDeck, setCurrentPlayerIsDrawingFromDeck] =
    useState<boolean>(false);

  // cleanup timer just in case the current player doesn't receive the
  // "playerDrawnFromDeck" emit from the server
  const fallbackPlayerIsDrawingFromDeckTimerIdRef = useRef<NodeJS.Timeout>();

  const [decksAreBeingRotated, setDecksAreBeingRotated] =
    useState<boolean>(false);

  const [playerIDWhoSqueaked, setPlayerIDWhoSqueaked] = useState<string | null>(
    null,
  );

  const [connectedToRoom, setConnectedToRoom] = useState<boolean>(false);
  const [otherPlayerIDsDrawingFromDeck, setOtherPlayerIDsDrawingFromDeck] =
    useState<string[]>([]);

  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);
  const [showShufflingCountdown, setShowShufflingCountdown] =
    useState<boolean>(false);

  // null represents a player who doesn't have a connection to the server
  const [playerPing, setPlayerPing] = useState<number | null>(0);

  const [scoreboardMetadata, setScoreboardMetadata] =
    useState<IScoreboardMetadata | null>(null);

  const [cardBeingMovedProgramatically, setCardBeingMovedProgramatically] =
    useState<ICardBeingMovedProgramatically>({});

  // planning on combining below and above into generic [] that has "deck" "squeak" etc..
  const [
    squeakDeckBeingMovedProgramatically,
    setSqueakDeckBeingMovedProgramatically,
  ] = useState<ICardBeingMovedProgramatically>({});

  const [newInviteNotification, setNewInviteNotification] =
    useState<boolean>(false);

  const [squeakStackDragAlterations, setSqueakStackDragAlterations] = useState<{
    [playerID: string]: SqueakStackDragAlterations;
  }>({});

  const [currentVotes, setCurrentVotes] = useState<("agree" | "disagree")[]>(
    [],
  );
  const [voteType, setVoteType] = useState<
    "rotateDecks" | "finishRound" | null
  >(null);
  const [votingIsLockedOut, setVotingIsLockedOut] = useState(false);
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [passiveVoteResolutionTimerId, setPassiveVoteResolutionTimerId] =
    useState<NodeJS.Timeout | undefined>();
  const [votingLockoutStartTimestamp, setVotingLockoutStartTimestamp] =
    useState<number | null>(null);
  const [showVotingOptionButtons, setShowVotingOptionButtons] = useState(true);

  useEffect(() => {
    fetch("/api/socket");
  }, []);

  useEffect(() => {
    if (audioContext === null) return;

    const fetchAudioFile = async (path: string) => {
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      return await audioContext.decodeAudioData(arrayBuffer);
    };

    fetchAudioFile("/sounds/successfulMove.mp3").then((buffer) =>
      setSuccessfulMoveBuffer(buffer),
    );
    fetchAudioFile("/sounds/notAllowed.mp3").then((buffer) =>
      setNotAllowedMoveBuffer(buffer),
    );
    fetchAudioFile("/sounds/otherPlayerCardMove.mp3").then((buffer) =>
      setOtherPlayerCardMoveBuffer(buffer),
    );
    fetchAudioFile("/sounds/squeakButtonPress.mp3").then((buffer) =>
      setSqueakButtonPressBuffer(buffer),
    );
    fetchAudioFile("/sounds/confettiPop.mp3").then((buffer) =>
      setConfettiPopBuffer(buffer),
    );
  }, [audioContext]);

  useEffect(() => {
    if (currentVolume === null || !masterVolumeGainNode) return;

    localStorage.setItem("squeak-volume", currentVolume.toString());

    const fixedVolume = currentVolume * 0.005;
    masterVolumeGainNode.gain.value = Number(fixedVolume.toFixed(2));
  }, [currentVolume, masterVolumeGainNode]);

  useEffect(() => {
    const storedVolume = localStorage.getItem("squeak-volume");

    if (storedVolume) {
      setCurrentVolume(parseFloat(storedVolume));
    } else {
      localStorage.setItem("squeak-volume", "25");
      setCurrentVolume(25);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && userID && friendData === undefined) {
      socket.volatile.emit("initializePlayerInFriendsObj", userID);
    }
  }, [isSignedIn, userID, friendData]);

  useEffect(() => {
    if (isSignedIn) {
      socket.volatile.emit("modifyFriendData", {
        action: "roomMetadataUpdate",
        initiatorID: userID,
        currentRoomIsPublic: roomConfig.isPublic,
        currentRoomIsFull: roomConfig.playersInRoom === roomConfig.maxPlayers,
      });
    }
  }, [roomConfig, isSignedIn, userID]);

  // initializing player metadata w/ their database values (if authenticated)
  useEffect(() => {
    if (
      playerMetadata[userID] !== undefined ||
      !isLoaded ||
      !isSignedIn ||
      user === undefined ||
      userID === ""
    )
      return;

    setPlayerMetadata((prev) => ({
      ...prev,
      [userID]: {
        username: user ? user.username : "",
        avatarPath: user ? user.avatarPath : "/avatars/rabbit.svg",
        color: user ? user.color : "oklch(64.02% 0.171 15.38)",
        deckHueRotation: user ? user.deckHueRotation : 232,
      } as IRoomPlayer,
    }));

    setDeckVariantIndex(user ? user.deckVariantIndex : 0);
    setMirrorPlayerContainer(user ? !user.squeakPileOnLeft : false);
  }, [userID, user, playerMetadata, isLoaded, isSignedIn]);

  // initializing player metadata w/ their database values (if not authenticated)
  useEffect(() => {
    if (
      playerMetadata[userID] !== undefined ||
      !isLoaded ||
      isSignedIn ||
      user !== null
    )
      return;

    const localStorageUsername = localStorage.getItem("squeak-username");
    const localStoragePlayerMetadata = localStorage.getItem(
      "squeak-playerMetadata",
    );

    let parsedPlayerMetadata: {
      avatarPath: string;
      color: string;
      deckVariantIndex: number;
      deckHueRotation: number;
    } = {
      avatarPath: "/avatars/rabbit.svg",
      color: "oklch(64.02% 0.171 15.38)",
      deckVariantIndex: 0,
      deckHueRotation: 232,
    };

    if (localStoragePlayerMetadata) {
      parsedPlayerMetadata = JSON.parse(localStoragePlayerMetadata);
    } else {
      localStorage.setItem(
        "squeak-playerMetadata",
        JSON.stringify({
          avatarPath: "/avatars/rabbit.svg",
          color: "oklch(64.02% 0.171 15.38)",
          deckVariantIndex: 0,
          deckHueRotation: 232,
        }),
      );
    }

    // TODO: even if it isn't strictly used by backend, maybe include
    // the deckVariantIndex in playerMetadata just to simplify things?

    setPlayerMetadata((prev) => ({
      ...prev,
      [userID]: {
        username: localStorageUsername ?? "",
        avatarPath: parsedPlayerMetadata.avatarPath,
        color: parsedPlayerMetadata.color,
        deckHueRotation: parsedPlayerMetadata.deckHueRotation,
      } as IRoomPlayer,
    }));

    setDeckVariantIndex(parsedPlayerMetadata.deckVariantIndex);
    setMirrorPlayerContainer(false);
  }, [userID, user, playerMetadata, isLoaded, isSignedIn]);

  const context: IRoomContext = {
    viewportLabel,
    audioContext,
    setAudioContext,
    masterVolumeGainNode,
    setMasterVolumeGainNode,
    successfulMoveBuffer,
    notAllowedMoveBuffer,
    otherPlayerCardMoveBuffer,
    squeakButtonPressBuffer,
    confettiPopBuffer,
    showSettingsDialog,
    setShowSettingsDialog,
    showUserWasKickedDialog,
    setShowUserWasKickedDialog,
    roomConfig,
    setRoomConfig,
    playerMetadata,
    setPlayerMetadata,
    gameData,
    setGameData,
    resetPlayerStateUponPageLoad,
    setResetPlayerStateUponPageLoad,
    currentPlayerIsDrawingFromDeck,
    setCurrentPlayerIsDrawingFromDeck,
    fallbackPlayerIsDrawingFromDeckTimerIdRef,
    friendData,
    setFriendData,
    hoveredCell,
    setHoveredCell,
    hoveredSqueakStack,
    setHoveredSqueakStack,
    holdingADeckCard,
    setHoldingADeckCard,
    holdingASqueakCard,
    setHoldingASqueakCard,
    originIndexForHeldSqueakCard,
    setOriginIndexForHeldSqueakCard,
    heldSqueakStackLocation,
    setHeldSqueakStackLocation,
    proposedCardBoxShadow,
    setProposedCardBoxShadow,
    decksAreBeingRotated,
    setDecksAreBeingRotated,
    playerIDWhoSqueaked,
    setPlayerIDWhoSqueaked,
    otherPlayerIDsDrawingFromDeck,
    setOtherPlayerIDsDrawingFromDeck,
    showScoreboard,
    setShowScoreboard,
    showShufflingCountdown,
    setShowShufflingCountdown,
    playerPing,
    setPlayerPing,
    scoreboardMetadata,
    setScoreboardMetadata,
    connectedToRoom,
    setConnectedToRoom,
    currentVolume,
    setCurrentVolume,
    deckVariantIndex,
    setDeckVariantIndex,
    cardBeingMovedProgramatically,
    setCardBeingMovedProgramatically,
    newInviteNotification,
    setNewInviteNotification,
    mirrorPlayerContainer,
    setMirrorPlayerContainer,
    squeakDeckBeingMovedProgramatically,
    setSqueakDeckBeingMovedProgramatically,
    squeakStackDragAlterations,
    setSqueakStackDragAlterations,
    currentVotes,
    setCurrentVotes,
    voteType,
    setVoteType,
    votingIsLockedOut,
    setVotingIsLockedOut,
    showVotingDialog,
    setShowVotingDialog,
    passiveVoteResolutionTimerId,
    setPassiveVoteResolutionTimerId,
    votingLockoutStartTimestamp,
    setVotingLockoutStartTimestamp,
    showVotingOptionButtons,
    setShowVotingOptionButtons,
  };

  return (
    <RoomContext.Provider value={context}>
      {props.children}
    </RoomContext.Provider>
  );
}

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (context === null) {
    throw new Error("useRoomContext must be used within a RoomProvider");
  }
  return context;
}
