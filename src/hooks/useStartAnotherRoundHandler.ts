import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IGameMetadata } from "../pages/api/socket";

function useStartAnotherRoundHandler() {
  const roomCtx = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IGameMetadata | null>(
    null
  );

  useEffect(() => {
    socket.on("startNewRound", (data) => setDataFromBackend(data));

    return () => {
      socket.off("startNewRound", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      roomCtx.setGameData(dataFromBackend);

      roomCtx.setShowScoreboard(false);

      setTimeout(() => {
        roomCtx.setShowShufflingCountdown(true);
      }, 500);
    }
  }, [dataFromBackend, roomCtx]);
}

export default useStartAnotherRoundHandler;
