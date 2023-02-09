import { useState, useEffect } from "react";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IMoveBackToLobby } from "../pages/api/socket";

function useReturnToRoomHandler() {
  const {
    roomConfig,
    setPageToRender,
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

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
