import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../context/UserIDContext";
import { useMainStore } from "~/stores/MainStore";

function useAttachUnloadEventListener() {
  const { isSignedIn } = useAuth();
  const userID = useUserIDContext();

  const { roomConfig, connectedToRoom } = useMainStore((state) => ({
    roomConfig: state.roomConfig,
    connectedToRoom: state.connectedToRoom,
  }));

  useEffect(() => {
    function leaveRoomOnPageClose() {
      if (connectedToRoom) {
        socket.volatile.emit("leaveRoom", {
          playerID: userID,
          roomCode: roomConfig.code,
          playerWasKicked: false,
        });
      }

      if (isSignedIn) {
        socket.volatile.emit("modifyFriendData", {
          action: "goOffline",
          initiatorID: userID,
        });
      }
    }

    window.addEventListener("unload", leaveRoomOnPageClose);
  }, [
    userID,
    roomConfig.code,
    roomConfig.playersInRoom,
    connectedToRoom,
    isSignedIn,
  ]);
}

export default useAttachUnloadEventListener;
