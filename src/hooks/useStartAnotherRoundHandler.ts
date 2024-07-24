import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IGameMetadata } from "../pages/api/socket";
import { useMainStore } from "~/stores/MainStore";
import useGetUserID from "~/hooks/useGetUserID";

function useStartAnotherRoundHandler() {
  const userID = useGetUserID();

  const {
    roomConfig,
    gameData,
    playerMetadata,
    setGameData,
    setShowScoreboard,
    setShowShufflingCountdown,
  } = useMainStore((state) => ({
    roomConfig: state.roomConfig,
    gameData: state.gameData,
    playerMetadata: state.playerMetadata,
    setGameData: state.setGameData,
    setShowScoreboard: state.setShowScoreboard,
    setShowShufflingCountdown: state.setShowShufflingCountdown,
  }));

  const [dataFromBackend, setDataFromBackend] = useState<{
    roomCode: string;
    gameData: IGameMetadata;
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

      setShowScoreboard(false);

      setTimeout(() => {
        setShowShufflingCountdown(true);

        // only want one "startGame" event to be emitted
        if (roomConfig.hostUserID === userID) {
          socket.emit("startGame", {
            roomCode: dataFromBackend.roomCode,
            firstRound: false,
          });
        }
      }, 200); // waiting for scoreboard modal to close
    }
  }, [
    dataFromBackend,
    setShowScoreboard,
    setShowShufflingCountdown,
    setGameData,
    playerMetadata,
    roomConfig,
    gameData,
    userID,
  ]);
}

export default useStartAnotherRoundHandler;
