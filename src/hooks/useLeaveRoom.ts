import { socket } from "~/pages/_app";
import { useAuth } from "@clerk/nextjs";
import { useUserIDContext } from "../context/UserIDContext";
import { useRouter } from "next/router";
import { useMainStore } from "~/stores/MainStore";

interface IUseLeaveRoom {
  routeToNavigateTo: string;
}

function useLeaveRoom({ routeToNavigateTo }: IUseLeaveRoom) {
  const { isSignedIn } = useAuth();
  const userID = useUserIDContext();
  const { push } = useRouter();

  const {
    roomConfig,
    connectedToRoom,
    setResetPlayerStateUponPageLoad,
    setShowUserWasKickedDialog,
  } = useMainStore((state) => ({
    roomConfig: state.roomConfig,
    connectedToRoom: state.connectedToRoom,
    setResetPlayerStateUponPageLoad: state.setResetPlayerStateUponPageLoad,
    setShowUserWasKickedDialog: state.setShowUserWasKickedDialog,
  }));

  function leaveRoom(playerWasKicked = false) {
    setResetPlayerStateUponPageLoad(true);
    push(routeToNavigateTo);

    if (connectedToRoom) {
      // Emit "leaveRoom" event only if the player is leaving voluntarily.
      // If the player was kicked, the server will automatically emit
      // a "playerHasLeftRoom" event.

      if (playerWasKicked) {
        setShowUserWasKickedDialog(true);
      } else {
        socket.volatile.emit("leaveRoom", {
          playerID: userID,
          roomCode: roomConfig.code,
          playerWasKicked: false,
        });
      }

      if (isSignedIn) {
        socket.volatile.emit("modifyFriendData", {
          action: "leaveRoom",
          initiatorID: userID,
        });
      }
    }
  }

  return leaveRoom;
}

export default useLeaveRoom;
