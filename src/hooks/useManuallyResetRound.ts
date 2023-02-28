import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";

function useManuallyResetRound() {
  const { roomConfig, setShowResetRoundModal } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<boolean | null>(null);

  useEffect(() => {
    socket.on("manuallyResetRound", () => setDataFromBackend(true));

    return () => {
      socket.off("manuallyResetRound", () => setDataFromBackend(true));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      setShowResetRoundModal(true);

      setTimeout(() => {
        setShowResetRoundModal(false);
        socket.emit("resetGame", {
          gameIsFinished: false,
          resettingRoundFromExcessiveDeckRotations: true,
          roomCode: roomConfig.code,
        });
      }, 2000);
    }
  }, [dataFromBackend, setShowResetRoundModal, roomConfig.code]);
}

export default useManuallyResetRound;
