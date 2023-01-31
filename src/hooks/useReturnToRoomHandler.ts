import { useState, useEffect } from "react";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IGameMetadata } from "../pages/api/socket";

function useReturnToRoomHandler() {
  const { roomConfig, setPageToRender } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const [dataFromBackend, setDataFromBackend] = useState<IGameMetadata | null>(
    null
  );

  useEffect(() => {
    socket.on("moveBackToLobby", (data) => setDataFromBackend(data));

    return () => {
      socket.off("moveBackToLobby", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      if (userID === roomConfig.hostUserID) {
        setPageToRender("createRoom");
      } else {
        setPageToRender("joinRoom");
      }
    }
  }, [dataFromBackend, setPageToRender, roomConfig.hostUserID, userID]);
}

export default useReturnToRoomHandler;
