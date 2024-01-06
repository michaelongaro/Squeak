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

export interface ISoundStates {
  currentPlayer: boolean;
  otherPlayers: {
    [playerID: string]: boolean;
  };
  squeakSound: boolean;
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

interface OtherPlayerSqueakStacksBeingDragged {
  squeakStackDepthAlterations: number[]; // -2 means decreasing effective length of stack by 2 (allowing gaps between cards to expand)
  draggedStack?: OtherPlayersDraggedStack;
}

export interface IInitSqueakStackCardBeingDealt {
  location: string;
  indexToDealTo: number;
}

interface IRoomContext {
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
  soundPlayStates: ISoundStates;
  setSoundPlayStates: React.Dispatch<React.SetStateAction<ISoundStates>>;
  currentVolume: number;
  setCurrentVolume: React.Dispatch<React.SetStateAction<number>>;
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

  currentPlayerSqueakStackBeingDragged: DraggedStack | null;
  setCurrentPlayerSqueakStackBeingDragged: React.Dispatch<
    React.SetStateAction<DraggedStack | null>
  >;
  otherPlayerSqueakStacksBeingDragged: {
    [playerID: string]: OtherPlayerSqueakStacksBeingDragged;
  };
  setOtherPlayerSqueakStacksBeingDragged: React.Dispatch<
    React.SetStateAction<{
      [playerID: string]: OtherPlayerSqueakStacksBeingDragged;
    }>
  >;
}

const RoomContext = createContext<IRoomContext | null>(null);

export function RoomProvider(props: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userID = useUserIDContext();

  // probably want to remove the default "refetch on page focus" behavior
  const { data: user } = trpc.users.getUserByID.useQuery(userID);

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

  const [currentVolume, setCurrentVolume] = useState<number>(0);

  const [soundPlayStates, setSoundPlayStates] = useState<ISoundStates>({
    currentPlayer: false,
    otherPlayers: {},
    squeakSound: false,
  });

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

  const [mirrorPlayerContainer, setMirrorPlayerContainer] =
    useState<boolean>(false);

  const [
    currentPlayerSqueakStackBeingDragged,
    setCurrentPlayerSqueakStackBeingDragged,
  ] = useState<DraggedStack | null>({
    squeakStackIdx: -1,
    startingDepth: -1,
    length: -1,
  });

  const [
    otherPlayerSqueakStacksBeingDragged,
    setOtherPlayerSqueakStacksBeingDragged,
  ] = useState<{
    [playerID: string]: OtherPlayerSqueakStacksBeingDragged;
  }>({});

  useEffect(() => {
    fetch("/api/socket");
  }, []);

  // might want to move into a hook eventually
  useEffect(() => {
    setTimeout(() => {
      const storedVolume = localStorage.getItem("volume");

      if (storedVolume) {
        setCurrentVolume(parseFloat(storedVolume));
      }
    }, 1500);
  }, []);

  useEffect(() => {
    if (userID && friendData === undefined) {
      socket.emit("initializePlayerInFriendsObj", userID);
    }
  }, [userID, friendData]);

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

    setMirrorPlayerContainer(user ? !user.squeakPileOnLeft : false);
  }, [userID, user, playerMetadata, session, status]);

  const context: IRoomContext = {
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
    soundPlayStates,
    setSoundPlayStates,
    currentVolume,
    setCurrentVolume,
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
    currentPlayerSqueakStackBeingDragged,
    setCurrentPlayerSqueakStackBeingDragged,
    otherPlayerSqueakStacksBeingDragged,
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
