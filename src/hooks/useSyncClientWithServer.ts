import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IGameMetadata } from "../pages/api/socket";
import { useMainStore } from "~/stores/MainStore";

function useSyncClientWithServer() {
  const { setGameData } = useMainStore((state) => ({
    setGameData: state.setGameData,
  }));

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
    }
  }, [dataFromBackend, setGameData]);
}

export default useSyncClientWithServer;
