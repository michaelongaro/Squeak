import { useState, useEffect } from "react";
import { socket } from "~/lib/socket";
import { useRoomContext } from "../context/RoomContext";
import { type IGameMetadata } from "~/types/socket";

function useRotatePlayerDecks() {
  const { setGameData, setDecksAreBeingRotated } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IGameMetadata | null>(
    null,
  );

  useEffect(() => {
    socket.on("decksWereRotated", setDataFromBackend);

    return () => {
      socket.off("decksWereRotated", setDataFromBackend);
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
