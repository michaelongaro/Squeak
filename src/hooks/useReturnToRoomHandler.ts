import { useState, useEffect } from "react";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IMoveBackToLobby } from "../pages/api/socket";
import { trpc } from "../utils/trpc";

function useReturnToRoomHandler() {
  const {
    roomConfig,
    setPageToRender,
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
  } = useRoomContext();
  const userID = useUserIDContext();
  const updateRoomInDatabase = trpc.rooms.updateRoomConfig.useMutation();

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

      updateRoomInDatabase.mutate(newRoomConfig);

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
    updateRoomInDatabase,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
  ]);
}

export default useReturnToRoomHandler;
