import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IMoveBackToLobby } from "../pages/api/socket";
import { useRouter } from "next/router";
import { useMainStore } from "~/stores/MainStore";

function useReturnToRoomHandler() {
  const { push } = useRouter();

  const { roomConfig, setRoomConfig, setPlayerMetadata, setGameData, userID } =
    useMainStore((state) => ({
      roomConfig: state.roomConfig,
      setRoomConfig: state.setRoomConfig,
      setPlayerMetadata: state.setPlayerMetadata,
      setGameData: state.setGameData,
      userID: state.userID,
    }));

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
        push("/create");
      } else {
        push(`/join/${newRoomConfig.code}`);
      }
    }
  }, [
    dataFromBackend,
    push,
    roomConfig.hostUserID,
    userID,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
  ]);
}

export default useReturnToRoomHandler;
