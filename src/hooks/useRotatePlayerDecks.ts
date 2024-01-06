import { useState, useEffect } from "react";
import { socket } from "../pages";
import { useRoomContext } from "../context/RoomContext";
import { type IGameMetadata } from "./../pages/api/socket";

function useRotatePlayerDecks() {
  const { setGameData, setShowDecksAreBeingRotatedModal } = useRoomContext();

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

      setShowDecksAreBeingRotatedModal(true);

      // staggered to allow the user to read the tooltip for a second
      setTimeout(() => {
        setGameData(dataFromBackend);
        setShowDecksAreBeingRotatedModal(false);
      }, 2000);
    }
  }, [dataFromBackend, setGameData, setShowDecksAreBeingRotatedModal]);
}

export default useRotatePlayerDecks;
