import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IGameMetadata } from "./../pages/api/socket";
import { useMainStore } from "~/stores/MainStore";

function useRotatePlayerDecks() {
  const { setGameData, setDecksAreBeingRotated } = useMainStore((state) => ({
    setGameData: state.setGameData,
    setDecksAreBeingRotated: state.setDecksAreBeingRotated,
  }));

  const [dataFromBackend, setDataFromBackend] = useState<IGameMetadata | null>(
    null,
  );

  useEffect(() => {
    socket.on("decksWereRotated", (data) => setDataFromBackend(data));

    return () => {
      socket.off("decksWereRotated", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      setDecksAreBeingRotated(true);

      setTimeout(() => {
        setGameData(dataFromBackend);
      }, 1000);
    }
  }, [dataFromBackend, setGameData, setDecksAreBeingRotated]);
}

export default useRotatePlayerDecks;
