import { createContext, useContext, useState, useEffect } from "react";
import {
  type IPlayerMetadata,
  type IRoomConfig,
} from "../components/CreateRoom/CreateRoom";

interface IRoomContext {
  pageToRender: "home" | "createRoom" | "joinRoom" | "play";
  setPageToRender: React.Dispatch<
    React.SetStateAction<"home" | "createRoom" | "joinRoom" | "play">
  >;
  roomConfig: IRoomConfig;
  setRoomConfig: React.Dispatch<React.SetStateAction<IRoomConfig>>;
  playerMetadata: IPlayerMetadata[];
  setPlayerMetadata: React.Dispatch<React.SetStateAction<IPlayerMetadata[]>>;
}

const RoomContext = createContext<IRoomContext | null>(null);

export function RoomProvider(props: any) {
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
  // initialize with data and get rid of ("| undefined")
  const [playerMetadata, setPlayerMetadata] = useState<IPlayerMetadata[]>([]);

  useEffect(() => {
    socketInitializer();
  }, []);

  const socketInitializer = async () => {
    await fetch("/api/socket");
  };

  const context: IRoomContext = {
    pageToRender,
    setPageToRender,
    roomConfig,
    setRoomConfig,
    playerMetadata,
    setPlayerMetadata,
  };

  return (
    <RoomContext.Provider value={context}>
      {props.children}
    </RoomContext.Provider>
  );
}

// export default LocalStorageContext;

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (context === null) {
    throw new Error("useRoomContext must be used within a RoomProvider");
  }
  return context;
}
