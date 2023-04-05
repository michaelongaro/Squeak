import { useState, useEffect } from "react";
import { socket } from "../pages";
import { useRoomContext } from "../context/RoomContext";
import { type IGameMetadata } from "../pages/api/socket";

function useStartAnotherRoundHandler() {
  const {
    setGameData,
    setPlayerIDToStartNextRound,
    setShowScoreboard,
    setShowShufflingCountdown,
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
      }, 2200);
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
