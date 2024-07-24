import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { socket } from "~/pages/_app";
import { useMainStore } from "~/stores/MainStore";
import useGetUserID from "~/hooks/useGetUserID";

function useAttachUnloadEventListener() {
  const { isSignedIn } = useAuth();
  const userID = useGetUserID();

  const { roomConfig, connectedToRoom } = useMainStore((state) => ({
    roomConfig: state.roomConfig,
    connectedToRoom: state.connectedToRoom,
  }));

  useEffect(() => {
    function leaveRoomOnPageClose() {
      if (connectedToRoom) {
        socket.emit("leaveRoom", {
          playerID: userID,
          roomCode: roomConfig.code,
          playerWasKicked: false,
        });
      }

      if (isSignedIn) {
        socket.emit("modifyFriendData", {
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
