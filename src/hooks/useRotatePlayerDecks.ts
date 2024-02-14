import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IGameMetadata } from "./../pages/api/socket";

function useRotatePlayerDecks() {
  const { setGameData, setDecksAreBeingRotated } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IGameMetadata | null>(
    null
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
