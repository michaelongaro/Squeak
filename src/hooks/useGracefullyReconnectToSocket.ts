import { useEffect, useState } from "react";
import { useRoomContext } from "~/context/RoomContext";
import { useUserIDContext } from "~/context/UserIDContext";
import { socket } from "~/pages/_app";
import type { IRoomConfig } from "~/pages/create";
import type { IGameMetadata, IRoomPlayersMetadata } from "~/pages/api/socket";

interface ICurrentRoomMetadata {
  roomConfig: IRoomConfig;
  playerMetadata: IRoomPlayersMetadata;
  gameData: IGameMetadata;
}

function useGracefullyReconnectToSocket() {
  const userID = useUserIDContext();

  const {
    roomConfig,
    connectedToRoom,
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<ICurrentRoomMetadata | null>(null);

  // by their nature, websocket connections close and reopen
  // on their own accord, so we need to listen for the "connect" event
  // to attempt to reconnect to the user's room (& set the current metadata)
  // if they were connected to a room prior to the websocket connection closing

  useEffect(() => {
    function handleGracefullyReconnectToRoom() {
      if (userID && connectedToRoom && roomConfig.code) {
        socket.emit("attemptToGracefullyReconnectToRoom", {
          roomCode: roomConfig.code,
          userID,
        });
      }
    }

    function handleRedirectToHomepage(userIDBeingRedirected: string) {
      if (userID === userIDBeingRedirected) {
        window.location.href = "/";
      }
    }

    socket.on("connect", handleGracefullyReconnectToRoom);
    socket.on("redirectToHomepage", handleRedirectToHomepage);

    return () => {
      socket.off("connect", handleGracefullyReconnectToRoom);
      socket.off("redirectToHomepage", handleRedirectToHomepage);
    };
  }, [roomConfig.code, connectedToRoom, userID]);

  useEffect(() => {
    socket.on("currentRoomMetadata", (data) => setDataFromBackend(data));

    return () => {
      socket.off("currentRoomMetadata", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      setRoomConfig(dataFromBackend.roomConfig);
      setPlayerMetadata(dataFromBackend.playerMetadata);
      setGameData(dataFromBackend.gameData);
    }
  }, [
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
    dataFromBackend,
    setDataFromBackend,
  ]);
}

export default useGracefullyReconnectToSocket;
