import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IPlayerHasLeftRoom } from "./../pages/api/socket";
import useLeaveRoom from "./useLeaveRoom";
import { useRouter } from "next/router";
import { useMainStore } from "~/stores/MainStore";
import useGetUserID from "~/hooks/useGetUserID";

function usePlayerLeftRoom() {
  const userID = useGetUserID();
  const { push } = useRouter();

  const { setRoomConfig, setPlayerMetadata, setGameData, connectedToRoom } =
    useMainStore((state) => ({
      setRoomConfig: state.setRoomConfig,
      setPlayerMetadata: state.setPlayerMetadata,
      setGameData: state.setGameData,
      connectedToRoom: state.connectedToRoom,
    }));

  const leaveRoom = useLeaveRoom({
    routeToNavigateTo: "/",
  });

  const [dataFromBackend, setDataFromBackend] =
    useState<IPlayerHasLeftRoom | null>(null);

  useEffect(() => {
    if (!connectedToRoom) return; // probably keeping but not sure yet

    socket.on("playerHasLeftRoom", (data) => setDataFromBackend(data));

    return () => {
      socket.off("playerHasLeftRoom", (data) => setDataFromBackend(data));
    };
  }, [connectedToRoom]);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const {
        roomConfig,
        gameData,
        players,
        newHostID,
        playerWhoLeftID,
        playerWasKicked,
      } = dataFromBackend;

      // gets called if current user was kicked from room by host
      if (playerWhoLeftID === userID && playerWasKicked) {
        leaveRoom();

        socket.emit("directlyLeaveRoom", roomConfig.code);
        return;
      }

      if (playerWhoLeftID !== userID) {
        setRoomConfig(roomConfig);
        setPlayerMetadata(players);
        setGameData(gameData);
      }

      if (newHostID === userID && !roomConfig.gameStarted) {
        push("/create");
      }
    }
  }, [
    dataFromBackend,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
    push,
    userID,
    leaveRoom,
  ]);
}

export default usePlayerLeftRoom;
