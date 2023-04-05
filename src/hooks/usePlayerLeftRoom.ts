import { useState, useEffect } from "react";
import { socket } from "../pages";
import { useSession } from "next-auth/react";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IPlayerHasLeftRoom } from "./../pages/api/socket";
import useLeaveRoom from "./useLeaveRoom";

function usePlayerLeftRoom() {
  const { status } = useSession();

  const userID = useUserIDContext();

  const {
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
    connectedToRoom,
    setPageToRender,
  } = useRoomContext();

  const leaveRoom = useLeaveRoom();

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
        leaveRoom(false);

        socket.emit("directlyLeaveRoom", roomConfig.code);
        return;
      }

      if (playerWhoLeftID !== userID) {
        setRoomConfig(roomConfig);
        setPlayerMetadata(players);
        setGameData(gameData);
      }

      if (newHostID === userID && !roomConfig.gameStarted) {
        setPageToRender("createRoom");
      }
    }
  }, [
    dataFromBackend,
    status,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
    setPageToRender,
    userID,
    leaveRoom,
  ]);
}

export default usePlayerLeftRoom;
