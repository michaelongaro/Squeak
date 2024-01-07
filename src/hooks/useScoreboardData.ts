import { useState, useEffect } from "react";
import { socket } from "../pages";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IScoreboardMetadata } from "../pages/api/handlers/roundOverHandler";

interface IScoreboardMetadataWithPlayerIDToStartNextRound
  extends IScoreboardMetadata {
  playerIDToStartNextRound: string;
}

function useScoreboardData() {
  const userID = useUserIDContext();

  const {
    roomConfig,
    setGameData,
    setScoreboardMetadata,
    setShowScoreboard,
    setPlayerIDWhoSqueaked,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IScoreboardMetadataWithPlayerIDToStartNextRound | null>(null);

  useEffect(() => {
    socket.on("scoreboardMetadata", (data) => setDataFromBackend(data));

    return () => {
      socket.off("scoreboardMetadata", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const {
        gameWinnerID,
        roundWinnerID,
        playerRoundDetails,
        playerIDToStartNextRound,
      } = dataFromBackend;

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

        if (userID !== playerIDToStartNextRound) return;

        socket.emit("resetGame", {
          roomCode: roomConfig.code,
          resettingRoundFromExcessiveDeckRotations: false,
          gameIsFinished: gameWinnerID !== null,
        });
      }, 13500);
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
