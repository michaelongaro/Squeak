import React, { createContext, useContext, useState, useEffect } from "react";
import { socket } from "../pages";
import { type IRoomConfig } from "../components/CreateRoom/CreateRoom";
import {
  type IRoomPlayer,
  type IRoomPlayersMetadata,
  type IFriendsMetadata,
} from "../pages/api/socket";
import { type IGameMetadata } from "../pages/api/socket";
import { type IScoreboardMetadata } from "../pages/api/handlers/roundOverHandler";
import { useSession } from "next-auth/react";
import { useUserIDContext } from "./UserIDContext";
import { trpc } from "../utils/trpc";

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

interface IRoomContext {
  audioContext: AudioContext | null;
  masterVolumeGainNode: GainNode | null;
  pageToRender: "home" | "createRoom" | "joinRoom" | "play";
  setPageToRender: React.Dispatch<
    React.SetStateAction<"home" | "createRoom" | "joinRoom" | "play">
  >;
  showSettingsModal: boolean;
  setShowSettingsModal: React.Dispatch<React.SetStateAction<boolean>>;
  roomConfig: IRoomConfig;
  setRoomConfig: React.Dispatch<React.SetStateAction<IRoomConfig>>;
  playerMetadata: IRoomPlayersMetadata;
  setPlayerMetadata: React.Dispatch<React.SetStateAction<IRoomPlayersMetadata>>;
  gameData: IGameMetadata;
  setGameData: React.Dispatch<React.SetStateAction<IGameMetadata>>;
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
  showDecksAreBeingRotatedModal: boolean;
  setShowDecksAreBeingRotatedModal: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  playerIDWhoSqueaked: string | null;
  setPlayerIDWhoSqueaked: React.Dispatch<React.SetStateAction<string | null>>;
  showScoreboard: boolean;
  setShowScoreboard: React.Dispatch<React.SetStateAction<boolean>>;
  showShufflingCountdown: boolean;
  setShowShufflingCountdown: React.Dispatch<React.SetStateAction<boolean>>;
  connectedToRoom: boolean;
  setConnectedToRoom: React.Dispatch<React.SetStateAction<boolean>>;

  currentVolume: number | null;
  setCurrentVolume: React.Dispatch<React.SetStateAction<number | null>>;
  prefersSimpleCardAssets: boolean | null;
  setPrefersSimpleCardAssets: React.Dispatch<
    React.SetStateAction<boolean | null>
  >;

  cardBeingMovedProgramatically: ICardBeingMovedProgramatically;
  setCardBeingMovedProgramatically: React.Dispatch<
    React.SetStateAction<ICardBeingMovedProgramatically>
  >;
  newInviteNotification: boolean;
  setNewInviteNotification: React.Dispatch<React.SetStateAction<boolean>>;
  mirrorPlayerContainer: boolean;
  setMirrorPlayerContainer: React.Dispatch<React.SetStateAction<boolean>>;

  showResetRoundModal: boolean;
  setShowResetRoundModal: React.Dispatch<React.SetStateAction<boolean>>;
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
  setOtherPlayerSqueakStacksBeingDragged: React.Dispatch<
    React.SetStateAction<{
      [playerID: string]: SqueakStackDragAlterations;
    }>
  >;

  // audio file buffers
  successfulMoveBuffer: AudioBuffer | null;
  otherPlayerCardMoveBuffer: AudioBuffer | null;
  squeakButtonPressBuffer: AudioBuffer | null;
  confettiPopBuffer: AudioBuffer | null;
}

const RoomContext = createContext<IRoomContext | null>(null);

export function RoomProvider(props: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userID = useUserIDContext();

  // probably want to remove the default "refetch on page focus" behavior
  const { data: user } = trpc.users.getUserByID.useQuery(userID);

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [masterVolumeGainNode, setMasterVolumeGainNode] =
    useState<GainNode | null>(null);

  const [successfulMoveBuffer, setSuccessfulMoveBuffer] =
    useState<AudioBuffer | null>(null);
  const [otherPlayerCardMoveBuffer, setOtherPlayerCardMoveBuffer] =
    useState<AudioBuffer | null>(null);
  const [squeakButtonPressBuffer, setSqueakButtonPressBuffer] =
    useState<AudioBuffer | null>(null);
  const [confettiPopBuffer, setConfettiPopBuffer] =
    useState<AudioBuffer | null>(null);

  const [currentVolume, setCurrentVolume] = useState<number | null>(null);
  const [prefersSimpleCardAssets, setPrefersSimpleCardAssets] = useState<
    boolean | null
  >(null);

  const [pageToRender, setPageToRender] = useState<
    "home" | "createRoom" | "joinRoom" | "play"
  >("home");
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const [roomConfig, setRoomConfig] = useState<IRoomConfig>({
    pointsToWin: 100,
    maxPlayers: 2,
    playersInRoom: 1,
    isPublic: true,
    code: "",
    hostUsername: "",
    hostUserID: "",
    gameStarted: false,
  });
  const [playerMetadata, setPlayerMetadata] = useState<IRoomPlayersMetadata>(
    {} as IRoomPlayersMetadata
  );

  const [mirrorPlayerContainer, setMirrorPlayerContainer] =
    useState<boolean>(false);

  // safe, because we are only ever accessing/mutating gameData when it is defined
  const [gameData, setGameData] = useState<IGameMetadata>({} as IGameMetadata);

  const [friendData, setFriendData] = useState<IFriendsMetadata | undefined>();

  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [hoveredSqueakStack, setHoveredSqueakStack] = useState<number | null>(
    null
  );
  const [holdingADeckCard, setHoldingADeckCard] = useState<boolean>(false);
  const [holdingASqueakCard, setHoldingASqueakCard] = useState<boolean>(false);
  const [originIndexForHeldSqueakCard, setOriginIndexForHeldSqueakCard] =
    useState<number | null>(null);

  const [heldSqueakStackLocation, setHeldSqueakStackLocation] =
    useState<IHeldSqueakStackLocation | null>(null);

  const [proposedCardBoxShadow, setProposedCardBoxShadow] =
    useState<IProposedCardBoxShadow | null>(null);

  const [showDecksAreBeingRotatedModal, setShowDecksAreBeingRotatedModal] =
    useState<boolean>(false);

  const [playerIDWhoSqueaked, setPlayerIDWhoSqueaked] = useState<string | null>(
    null
  );

  const [connectedToRoom, setConnectedToRoom] = useState<boolean>(false);

  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);
  const [showShufflingCountdown, setShowShufflingCountdown] =
    useState<boolean>(false);
  const [showResetRoundModal, setShowResetRoundModal] =
    useState<boolean>(false);

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

  const [squeakStackDragAlterations, setOtherPlayerSqueakStacksBeingDragged] =
    useState<{
      [playerID: string]: SqueakStackDragAlterations;
    }>({});

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
      setSuccessfulMoveBuffer(buffer)
    );
    fetchAudioFile("/sounds/otherPlayerCardMove.mp3").then((buffer) =>
      setOtherPlayerCardMoveBuffer(buffer)
    );
    fetchAudioFile("/sounds/squeakButtonPress.mp3").then((buffer) =>
      setSqueakButtonPressBuffer(buffer)
    );
    fetchAudioFile("/sounds/confettiPop.mp3").then((buffer) =>
      setConfettiPopBuffer(buffer)
    );
  }, [audioContext]);

  useEffect(() => {
    if (audioContext && masterVolumeGainNode) return;
    const newAudioContext = new AudioContext();

    const newMasterVolumeGainNode = newAudioContext.createGain();

    newMasterVolumeGainNode.connect(newAudioContext.destination);

    setAudioContext(newAudioContext);
    setMasterVolumeGainNode(newMasterVolumeGainNode);
  }, [audioContext, masterVolumeGainNode]);

  useEffect(() => {
    if (userID && friendData === undefined) {
      socket.emit("initializePlayerInFriendsObj", userID);
    }
  }, [userID, friendData]);

  useEffect(() => {
    if (prefersSimpleCardAssets === null) return;

    localStorage.setItem(
      "squeakPrefersSimpleCardAssets",
      prefersSimpleCardAssets.toString()
    );
  }, [prefersSimpleCardAssets]);

  useEffect(() => {
    if (currentVolume === null || !masterVolumeGainNode) return;

    console.log("hitting check");
    localStorage.setItem("squeakVolume", currentVolume.toString());

    const fixedVolume = currentVolume * 0.01;
    masterVolumeGainNode.gain.value = Number(fixedVolume.toFixed(2));
  }, [currentVolume, masterVolumeGainNode]);

  useEffect(() => {
    if (status === "authenticated") {
      socket.emit("modifyFriendData", {
        action: "roomMetadataUpdate",
        initiatorID: userID,
        currentRoomIsPublic: roomConfig.isPublic,
        currentRoomIsFull: roomConfig.playersInRoom === roomConfig.maxPlayers,
      });
    }
  }, [roomConfig, status, userID]);

  useEffect(() => {
    if (
      playerMetadata[userID] !== undefined ||
      status === "loading" ||
      user === undefined ||
      userID === ""
    )
      return;

    // initializing player metadata w/ their database values (if authenticated)
    setPlayerMetadata((prev) => ({
      ...prev,
      [userID]: {
        username: user ? user.username : "",
        avatarPath: user ? user.avatarPath : "/avatars/rabbit.svg",
        color: user ? user.color : "hsl(352deg, 69%, 61%)",
        deckHueRotation: user ? user.deckHueRotation : 232,
      } as IRoomPlayer,
    }));

    setPrefersSimpleCardAssets(user ? user.prefersSimpleCardAssets : false);
    setMirrorPlayerContainer(user ? !user.squeakPileOnLeft : false);
  }, [userID, user, playerMetadata, session, status]);

  const context: IRoomContext = {
    audioContext,
    masterVolumeGainNode,
    successfulMoveBuffer,
    otherPlayerCardMoveBuffer,
    squeakButtonPressBuffer,
    confettiPopBuffer,
    pageToRender,
    setPageToRender,
    showSettingsModal,
    setShowSettingsModal,
    roomConfig,
    setRoomConfig,
    playerMetadata,
    setPlayerMetadata,
    gameData,
    setGameData,
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
    showDecksAreBeingRotatedModal,
    setShowDecksAreBeingRotatedModal,
    playerIDWhoSqueaked,
    setPlayerIDWhoSqueaked,
    showScoreboard,
    setShowScoreboard,
    showShufflingCountdown,
    setShowShufflingCountdown,
    scoreboardMetadata,
    setScoreboardMetadata,
    connectedToRoom,
    setConnectedToRoom,
    currentVolume,
    setCurrentVolume,
    prefersSimpleCardAssets,
    setPrefersSimpleCardAssets,
    cardBeingMovedProgramatically,
    setCardBeingMovedProgramatically,
    newInviteNotification,
    setNewInviteNotification,
    mirrorPlayerContainer,
    setMirrorPlayerContainer,
    showResetRoundModal,
    setShowResetRoundModal,
    squeakDeckBeingMovedProgramatically,
    setSqueakDeckBeingMovedProgramatically,
    squeakStackDragAlterations,
    setOtherPlayerSqueakStacksBeingDragged,
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
