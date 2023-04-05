import { socket } from "../pages";
import { trpc } from "../utils/trpc";
import { useSession } from "next-auth/react";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import {
  type IGameMetadata,
  type IRoomPlayer,
  type IRoomPlayersMetadata,
} from "../pages/api/socket";

function useLeaveRoom() {
  const { status } = useSession();
  const userID = useUserIDContext();

  const { data: user } = trpc.users.getUserByID.useQuery(userID);

  const {
    roomConfig,
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
    connectedToRoom,
    setConnectedToRoom,
    setPageToRender,
  } = useRoomContext();

  function leaveRoom(moveBackToHome: boolean) {
    if (moveBackToHome) {
      setPageToRender("home");
    }
    setRoomConfig({
      pointsToWin: 100,
      maxPlayers: 2,
      playersInRoom: 1,
      isPublic: true,
      code: "",
      hostUsername: "",
      hostUserID: "",
      gameStarted: false,
    });

    setPlayerMetadata({
      [userID]: {
        username: user?.username ?? "",
        avatarPath: user?.avatarPath ?? "/avatars/rabbit.svg",
        color: user?.color ?? "hsl(352deg, 69%, 61%)",
        deckHueRotation: user?.deckHueRotation ?? 232,
      } as IRoomPlayer,
    } as IRoomPlayersMetadata);
    setGameData({} as IGameMetadata);

    if (connectedToRoom) {
      setConnectedToRoom(false);

      socket.emit("leaveRoom", {
        playerID: userID,
        roomCode: roomConfig.code,
        playerWasKicked: false,
      });

      if (status === "authenticated") {
        socket.emit("modifyFriendData", {
          action: "leaveRoom",
          initiatorID: userID,
        });
      }
    }
  }

  return leaveRoom;
}

export default useLeaveRoom;
