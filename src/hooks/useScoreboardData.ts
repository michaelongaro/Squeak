import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { useUserIDContext } from "../context/UserIDContext";
import { socket } from "../pages";
import { type IScoreboardMetadata } from "../pages/api/handlers/roundOverHandler";

function useScoreboardData() {
  const {
    setGameData,
    roomConfig,
    setShowScoreboard,
    setPlayerIDWhoSqueaked,
    setScoreboardMetadata,
  } = useRoomContext();

  const { value: userID } = useUserIDContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IScoreboardMetadata | null>(null);

  useEffect(() => {
    socket.on("scoreboardMetadata", (data) => setDataFromBackend(data));

    return () => {
      socket.off("scoreboardMetadata", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { gameWinnerID, roundWinnerID, playerRoundDetails } =
        dataFromBackend;

      setPlayerIDWhoSqueaked(roundWinnerID);

      setTimeout(() => {
        setScoreboardMetadata({
          gameWinnerID,
          roundWinnerID,
          playerRoundDetails,
        });

        setShowScoreboard(true);
      }, 1000); // waiting for pulsing animation to finish

      setTimeout(() => {
        setPlayerIDWhoSqueaked(null);
        if (roundWinnerID !== userID) return;

        socket.emit("resetGame", {
          roomCode: roomConfig.code,
          resettingRoundFromExcessiveDeckRotations: false,
          gameIsFinished: gameWinnerID !== null,
        });
      }, 12500);
    }
  }, [
    dataFromBackend,
    roomConfig,
    userID,
    setGameData,
    setPlayerIDWhoSqueaked,
    setScoreboardMetadata,
    setShowScoreboard,
  ]);
}

export default useScoreboardData;
