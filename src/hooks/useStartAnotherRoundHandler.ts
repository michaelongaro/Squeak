import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IGameMetadata } from "../pages/api/socket";
import { useUserIDContext } from "../context/UserIDContext";

function useStartAnotherRoundHandler() {
  const userID = useUserIDContext();

  const {
    gameData,
    playerMetadata,
    setGameData,
    setShowScoreboard,
    setShowShufflingCountdown,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<{
    roomCode: string;
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

      setTimeout(() => {
        setShowScoreboard(false);
      }, 2000);

      setTimeout(() => {
        setShowShufflingCountdown(true);

        if (dataFromBackend.playerIDToStartNextRound === userID) {
          socket.emit("startGame", {
            roomCode: dataFromBackend.roomCode,
            firstRound: false,
          });
        }
      }, 2200);
    }
  }, [
    dataFromBackend,
    setShowScoreboard,
    setShowShufflingCountdown,
    setGameData,
    playerMetadata,
    gameData,
    userID,
  ]);
}

export default useStartAnotherRoundHandler;
