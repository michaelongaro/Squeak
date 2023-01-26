import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IScoreboardMetadata } from "../pages/api/handlers/roundOverHandler";

function useScoreboardData(): Partial<IScoreboardMetadata> | null {
  const roomCtx = useRoomContext();

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

      setScoreboardData({
        gameWinnerID,
        roundWinnerID,
        playerRoundDetails,
      });

      roomCtx.setGameData(gameData);

      setTimeout(() => {
        socket.emit("resetGame", {
          roomCode: roomCtx.roomConfig.code,
          gameIsFinished: gameWinnerID !== null,
        });
      }, 15000);
    }
  }, [dataFromBackend, roomCtx]);

  return scoreboardData;
}

export default useScoreboardData;
