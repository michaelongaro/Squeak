import { useState, useEffect } from "react";
import { useLocalStorageContext } from "../context/LocalStorageContext";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IGameMetadata } from "../pages/api/socket";

function useReturnToRoomHandler() {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

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

      if (userID === roomCtx.roomConfig.hostUserID) {
        roomCtx.setPageToRender("createRoom");
      } else {
        roomCtx.setPageToRender("joinRoom");
      }
    }
  }, [dataFromBackend, roomCtx, userID]);
}

export default useReturnToRoomHandler;
