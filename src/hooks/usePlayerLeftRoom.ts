import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { useUserIDContext } from "../context/UserIDContext";
import { socket } from "../pages";
import { type IPlayerHasLeftRoom } from "./../pages/api/socket";

function usePlayerLeftRoom() {
  const {
    setGameData,
    setRoomConfig,
    setPlayerMetadata,
    setPageToRender,
    connectedToRoom,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

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

      console.log("received in hook");

      const { roomConfig, gameData, players, newHostID } = dataFromBackend;

      console.table(roomConfig);
      console.table(players);
      console.log("new host id: ", newHostID);

      setRoomConfig(roomConfig);
      setPlayerMetadata(players);
      setGameData(gameData);

      if (newHostID === userID) {
        setPageToRender("createRoom");
      }
    }
  }, [
    dataFromBackend,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
    setPageToRender,
    userID,
  ]);
}

export default usePlayerLeftRoom;
