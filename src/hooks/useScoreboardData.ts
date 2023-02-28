import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
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

      const { gameWinnerID, roundWinnerID, gameData, playerRoundDetails } =
        dataFromBackend;

      setPlayerIDWhoSqueaked(roundWinnerID);

      setTimeout(() => {
        setShowScoreboard(true);

        setScoreboardMetadata({
          gameWinnerID,
          roundWinnerID,
          playerRoundDetails,
        });

        setGameData(gameData);
      }, 1000); // waiting for pulsing animation to finish

      setTimeout(() => {
        socket.emit("resetGame", {
          roomCode: roomConfig.code,
          resettingRoundFromExcessiveDeckRotations: false,
          gameIsFinished: gameWinnerID !== null,
        });

        setPlayerIDWhoSqueaked(null);
      }, 15000);
    }
  }, [
    dataFromBackend,
    roomConfig,
    setGameData,
    setPlayerIDWhoSqueaked,
    setScoreboardMetadata,
    setShowScoreboard,
  ]);
}

export default useScoreboardData;
