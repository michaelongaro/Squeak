import { createContext, useContext, useState, useEffect } from "react";
import {
  type IPlayerMetadata,
  type IRoomConfig,
} from "../components/CreateRoom/CreateRoom";
import { type IGameMetadata } from "../pages/api/socket";

interface IRoomContext {
  pageToRender: "home" | "createRoom" | "joinRoom" | "play";
  setPageToRender: React.Dispatch<
    React.SetStateAction<"home" | "createRoom" | "joinRoom" | "play">
  >;
  roomConfig: IRoomConfig;
  setRoomConfig: React.Dispatch<React.SetStateAction<IRoomConfig>>;
  playerMetadata: IPlayerMetadata[];
  setPlayerMetadata: React.Dispatch<React.SetStateAction<IPlayerMetadata[]>>;
  gameData: IGameMetadata | undefined;
  setGameData: React.Dispatch<React.SetStateAction<IGameMetadata | undefined>>;
  hoveredCell: [number, number] | null;
  setHoveredCell: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  holdingACard: boolean;
  setHoldingACard: React.Dispatch<React.SetStateAction<boolean>>;
}

const RoomContext = createContext<IRoomContext | null>(null);

export function RoomProvider(props: { children: React.ReactNode }) {
  const [pageToRender, setPageToRender] = useState<
    "home" | "createRoom" | "joinRoom" | "play"
  >("home");
  const [roomConfig, setRoomConfig] = useState<IRoomConfig>({
    pointsToWin: 100,
    maxRounds: 3,
    maxPlayers: 4,
    playersInRoom: 1,
    isPublic: true,
    code: "",
    hostUsername: "",
    hostUserID: "",
  });
  const [playerMetadata, setPlayerMetadata] = useState<IPlayerMetadata[]>([]);

  const [gameData, setGameData] = useState<IGameMetadata>();
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [holdingACard, setHoldingACard] = useState<boolean>(false);

  useEffect(() => {
    // socketInitializer();
    fetch("/api/socket");
  }, []);

  // const socketInitializer = async () => {
  //   await fetch("/api/socket");
  // };

  const context: IRoomContext = {
    pageToRender,
    setPageToRender,
    roomConfig,
    setRoomConfig,
    playerMetadata,
    setPlayerMetadata,
    gameData,
    setGameData,
    hoveredCell,
    setHoveredCell,
    holdingACard,
    setHoldingACard,
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
