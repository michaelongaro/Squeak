import { useState, useEffect } from "react";
import { socket } from "../pages";
import { useRoomContext } from "../context/RoomContext";
import { type IGameMetadata } from "../pages/api/socket";
import dealInitSqueakStackCards from "../utils/dealInitSqueakStackCards";

function useStartAnotherRoundHandler() {
  const {
    gameData,
    playerMetadata,
    setGameData,
    setPlayerIDToStartNextRound,
    setShowScoreboard,
    setShowShufflingCountdown,
    setInitSqueakStackCardBeingDealt,
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
        dealInitSqueakStackCards({
          players: playerMetadata,
          gameData,
          setInitSqueakStackCardBeingDealt,
        });
      }, 2200);
    }
  }, [
    dataFromBackend,
    setShowScoreboard,
    setShowShufflingCountdown,
    setPlayerIDToStartNextRound,
    setGameData,
    playerMetadata,
    gameData,
    setInitSqueakStackCardBeingDealt,
  ]);
}

export default useStartAnotherRoundHandler;
