import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IGameMetadata } from "../pages/api/socket";
import { useRoomContext } from "../context/RoomContext";

function useSyncClientWithServer() {
  const { setGameData, setServerGameData } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IGameMetadata | null>(
    null,
  );

  useEffect(() => {
    socket.on("syncClientWithServer", (data) => setDataFromBackend(data));

    return () => {
      socket.off("syncClientWithServer", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      setGameData(dataFromBackend);
      setServerGameData(dataFromBackend);
    }
  }, [dataFromBackend, setGameData, setServerGameData]);
}

export default useSyncClientWithServer;
