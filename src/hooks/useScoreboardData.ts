import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IScoreboardMetadata } from "../pages/api/handlers/roundOverHandler";

function useScoreboardData(): Partial<IScoreboardMetadata> | null {
  const { setGameData, roomConfig, setShowScoreboard, setPlayerIDWhoSqueaked } =
    useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IScoreboardMetadata | null>(null);

  const [scoreboardData, setScoreboardData] =
    useState<Partial<IScoreboardMetadata> | null>(null);

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
        setScoreboardData({
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
      }, 15000);
    }
  }, [
    dataFromBackend,
    roomConfig,
    setGameData,
    setPlayerIDWhoSqueaked,
    setShowScoreboard,
  ]);

  return scoreboardData;
}

export default useScoreboardData;
