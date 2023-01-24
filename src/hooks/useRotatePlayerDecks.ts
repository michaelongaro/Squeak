import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IGameMetadata } from "./../pages/api/socket";

function useRotatePlayerDecks() {
  const roomCtx = useRoomContext();

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

      roomCtx.setGameData(dataFromBackend);
      roomCtx.setDecksAreBeingRotated(true);

      setTimeout(() => {
        roomCtx.setDecksAreBeingRotated(false);
      }, 1000);
    }
  }, [dataFromBackend, roomCtx]);
}

export default useRotatePlayerDecks;
