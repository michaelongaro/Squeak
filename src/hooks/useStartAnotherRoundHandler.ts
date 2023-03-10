import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IGameMetadata } from "../pages/api/socket";

function useStartAnotherRoundHandler() {
  const {
    setGameData,
    setShowScoreboard,
    setShowShufflingCountdown,
    setPlayerIDToStartNextRound,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<{
    gameData: IGameMetadata;
    playerIDToStartNextRound: string;
  } | null>(null);

  useEffect(() => {
    socket.on("startNewRound", (data) => setDataFromBackend(data));

    return () => {
      socket.off("startNewRound", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      setGameData(dataFromBackend.gameData);
      setPlayerIDToStartNextRound(dataFromBackend.playerIDToStartNextRound);

      setTimeout(() => {
        setShowScoreboard(false);
      }, 2000);

      setTimeout(() => {
        setShowShufflingCountdown(true);
      }, 3000);
    }
  }, [
    dataFromBackend,
    setShowScoreboard,
    setShowShufflingCountdown,
    setPlayerIDToStartNextRound,
    setGameData,
  ]);
}

export default useStartAnotherRoundHandler;
