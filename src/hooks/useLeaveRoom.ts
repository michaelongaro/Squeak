import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import { useAuth } from "@clerk/nextjs";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import {
  type IGameMetadata,
  type IRoomPlayer,
  type IRoomPlayersMetadata,
} from "../pages/api/socket";
import { useRouter } from "next/router";

interface IUseLeaveRoom {
  routeToNavigateTo: string;
}

function useLeaveRoom({ routeToNavigateTo }: IUseLeaveRoom) {
  const { isSignedIn } = useAuth();
  const userID = useUserIDContext();
  const { push } = useRouter();

  const { data: user } = api.users.getUserByID.useQuery(userID);

  const {
    roomConfig,
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
    connectedToRoom,
    setConnectedToRoom,
  } = useRoomContext();

  function leaveRoom() {
    push(routeToNavigateTo);

    setTimeout(() => {
      setRoomConfig({
        pointsToWin: 100,
        maxPlayers: 2,
        playersInRoom: 1,
        playerIDsInRoom: [userID],
        isPublic: true,
        code: "",
        hostUsername: "",
        hostUserID: "",
        gameStarted: false,
      });

      if (userID !== "") {
        setPlayerMetadata({
          [userID]: {
            username: user?.username ?? "",
            avatarPath: user?.avatarPath ?? "/avatars/rabbit.svg",
            color: user?.color ?? "hsl(352deg, 69%, 61%)",
            deckHueRotation: user?.deckHueRotation ?? 232,
          } as IRoomPlayer,
        } as IRoomPlayersMetadata);
      }
    }, 100); // delay to allow the route to change before resetting the room config
    // w/o this there was slight flickering when the room was reset before the route changed

    setGameData({} as IGameMetadata);

    if (connectedToRoom) {
      setTimeout(() => {
        setConnectedToRoom(false);
      }, 100);
      // delay as a hack since the dynamicInitializationFlow effect was running in /join/[code]
      // when leaving a room..

      socket.emit("leaveRoom", {
        playerID: userID,
        roomCode: roomConfig.code,
        playerWasKicked: false,
      });

      if (isSignedIn) {
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
