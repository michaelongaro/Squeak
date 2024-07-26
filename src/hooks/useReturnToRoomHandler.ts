import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IMoveBackToLobby } from "../pages/api/socket";
import { useRouter } from "next/router";

function useReturnToRoomHandler() {
  const userID = useUserIDContext();
  const { push } = useRouter();

  const { roomConfig, setRoomConfig, setPlayerMetadata, setGameData } =
    useRoomContext();

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
