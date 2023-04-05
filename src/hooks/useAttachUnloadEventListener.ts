import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { socket } from "../pages";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";

function useAttachUnloadEventListener() {
  const { status } = useSession();
  const userID = useUserIDContext();

  const { roomConfig, connectedToRoom } = useRoomContext();

  useEffect(() => {
    function leaveRoomOnPageClose() {
      if (connectedToRoom) {
        socket.emit("leaveRoom", {
          playerID: userID,
          roomCode: roomConfig.code,
          playerWasKicked: false,
        });
      }

      if (status === "authenticated") {
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
    status,
  ]);
}

export default useAttachUnloadEventListener;
