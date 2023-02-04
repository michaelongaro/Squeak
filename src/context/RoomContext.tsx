import React, { createContext, useContext, useState, useEffect } from "react";
import { socket } from "../pages";
import { type IRoomConfig } from "../components/CreateRoom/CreateRoom";
import {
  type IRoomPlayer,
  type IRoomPlayersMetadata,
} from "../pages/api/socket";
import { type IGameMetadata } from "../pages/api/socket";
import { type IPlayerRoundDetails } from "../pages/api/handlers/roundOverHandler";
import { useSession } from "next-auth/react";
import { useUserIDContext } from "./UserIDContext";
import { trpc } from "../utils/trpc";

interface IHeldSqueakStackLocation {
  squeakStack: [number, number];
  location: { x: number; y: number };
}

interface IProposedCardBoxShadow {
  id: string;
  boxShadowValue: string;
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
  resetHeldSqueakStackLocation: [number, number] | null;
  setResetHeldSqueakStackLocation: React.Dispatch<
    React.SetStateAction<[number, number] | null>
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
}

const RoomContext = createContext<IRoomContext | null>(null);

export function RoomProvider(props: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { value: userID } = useUserIDContext();

  // probably want to remove the default "refetch on page focus" behavior
  const { data: user } = trpc.users.getUserByID.useQuery(userID);

  const [pageToRender, setPageToRender] = useState<
    "home" | "createRoom" | "joinRoom" | "play"
  >("home");
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const [roomConfig, setRoomConfig] = useState<IRoomConfig>({
    pointsToWin: 100,
    maxRounds: 3,
    maxPlayers: 2,
    playersInRoom: 1,
    isPublic: true,
    code: "",
    hostUsername: "",
    hostUserID: "",
  });
  const [playerMetadata, setPlayerMetadata] = useState<IRoomPlayersMetadata>(
    {} as IRoomPlayersMetadata
  );

  // safe, because we are only ever accessing/mutating gameData when it is defined
  const [gameData, setGameData] = useState<IGameMetadata>({} as IGameMetadata);
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
  const [resetHeldSqueakStackLocation, setResetHeldSqueakStackLocation] =
    useState<[number, number] | null>(null);

  const [proposedCardBoxShadow, setProposedCardBoxShadow] =
    useState<IProposedCardBoxShadow | null>(null);

  const [decksAreBeingRotated, setDecksAreBeingRotated] =
    useState<boolean>(false);

  const [playerIDWhoSqueaked, setPlayerIDWhoSqueaked] = useState<string | null>(
    null
  );

  const [connectedToRoom, setConnectedToRoom] = useState<boolean>(false);

  const [showScoreboard, setShowScoreboard] = useState<boolean>(false); // temp for testing - should be false
  const [showShufflingCountdown, setShowShufflingCountdown] =
    useState<boolean>(false);

  useEffect(() => {
    fetch("/api/socket");

    setTimeout(() => {
      socket.on(
        "scoreboardMetadata",
        ({ playerID: winnerID }: IPlayerRoundDetails) => {
          setPlayerIDWhoSqueaked(winnerID);

          // maybe need a timeout to set it back to null after a bit?
          // or just reset when you go through resetting everything (minus points, etc.)
          // before next round?
        }
      );
    });
  }, []);

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
    resetHeldSqueakStackLocation,
    setResetHeldSqueakStackLocation,
    proposedCardBoxShadow,
    setProposedCardBoxShadow,
    decksAreBeingRotated,
    setDecksAreBeingRotated,
    playerIDWhoSqueaked,
    setPlayerIDWhoSqueaked,
    showScoreboard,
    setShowScoreboard,
    showShufflingCountdown,
    setShowShufflingCountdown,
    connectedToRoom,
    setConnectedToRoom,
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
