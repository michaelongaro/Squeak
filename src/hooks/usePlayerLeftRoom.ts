import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { useUserIDContext } from "../context/UserIDContext";
import { socket } from "../pages";
import { trpc } from "../utils/trpc";
import { type IPlayerHasLeftRoom } from "./../pages/api/socket";

function usePlayerLeftRoom() {
  const {
    setGameData,
    setRoomConfig,
    setPlayerMetadata,
    setPageToRender,
    connectedToRoom,
    leaveRoom,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const updateRoomInDatabase = trpc.rooms.updateRoomConfig.useMutation();

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

      const { roomConfig, gameData, players, newHostID, playerWhoLeftID } =
        dataFromBackend;

      // gets called if current user was kicked from room by host
      if (playerWhoLeftID === userID) {
        leaveRoom(false);

        socket.emit("directlyLeaveRoom", roomConfig.code);
        return;
      }

      setRoomConfig(roomConfig);
      setPlayerMetadata(players);
      setGameData(gameData);

      updateRoomInDatabase.mutate(roomConfig);

      if (newHostID === userID) {
        setPageToRender("createRoom");
      }
    }
  }, [
    dataFromBackend,
    setGameData,
    setPlayerMetadata,
    updateRoomInDatabase,
    setRoomConfig,
    setPageToRender,
    userID,
    leaveRoom,
  ]);
}

export default usePlayerLeftRoom;
