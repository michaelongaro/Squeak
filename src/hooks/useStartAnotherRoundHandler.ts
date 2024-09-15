import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IGameMetadata } from "../pages/api/socket";
import { useUserIDContext } from "../context/UserIDContext";

function useStartAnotherRoundHandler() {
  const userID = useUserIDContext();

  const {
    roomConfig,
    setGameData,
    setShowScoreboard,
    setShowShufflingCountdown,
  } = useRoomContext();

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

      const { gameData, roomCode } = dataFromBackend;

      setGameData(gameData);

      setShowScoreboard(false);

      setTimeout(() => {
        setShowShufflingCountdown(true);

        // only want one "startGame" event to be emitted
        if (roomConfig.hostUserID === userID) {
          socket.emit("startGame", {
            roomCode,
            firstRound: false,
          });
        }
      }, 200); // waiting for scoreboard dialog to close
    }
  }, [
    dataFromBackend,
    setShowScoreboard,
    setShowShufflingCountdown,
    setGameData,
    roomConfig.hostUserID,
    userID,
  ]);
}

export default useStartAnotherRoundHandler;
