import { useState, useEffect } from "react";
import { socket } from "../pages";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IMoveBackToLobby } from "../pages/api/socket";

function useReturnToRoomHandler() {
  const userID = useUserIDContext();

  const {
    roomConfig,
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
    setPageToRender,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IMoveBackToLobby | null>(null);

  useEffect(() => {
    socket.on("moveBackToLobby", (data) => setDataFromBackend(data));

    return () => {
      socket.off("moveBackToLobby", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { roomConfig: newRoomConfig, players, gameData } = dataFromBackend;

      setRoomConfig(newRoomConfig);
      setPlayerMetadata(players);
      setGameData(gameData);

      if (userID === newRoomConfig.hostUserID) {
        setPageToRender("createRoom");
      } else {
        setPageToRender("joinRoom");
      }
    }
  }, [
    dataFromBackend,
    setPageToRender,
    roomConfig.hostUserID,
    userID,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
  ]);
}

export default useReturnToRoomHandler;
