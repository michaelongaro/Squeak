import { useRouter } from "next/router";
import { useEffect } from "react";
import { useRoomContext } from "~/context/RoomContext";
import { useUserIDContext } from "~/context/UserIDContext";
import type {
  IGameMetadata,
  IRoomPlayer,
  IRoomPlayersMetadata,
} from "~/pages/api/socket";
import { api } from "~/utils/api";

function useResetPlayerStateUponPageLoad() {
  const { events } = useRouter();
  const userID = useUserIDContext();

  const { data: user } = api.users.getUserByID.useQuery(userID);

  const {
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
    setConnectedToRoom,
    resetPlayerStateUponPageLoad,
    setResetPlayerStateUponPageLoad,
  } = useRoomContext();

  useEffect(() => {
    function handleRouteChange() {
      if (!resetPlayerStateUponPageLoad) return;

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
        const localStorageUsername = localStorage.getItem("squeakUsername");

        setPlayerMetadata({
          [userID]: {
            username: user?.username ?? localStorageUsername ?? "",
            avatarPath: user?.avatarPath ?? "/avatars/rabbit.svg",
            color: user?.color ?? "hsl(352deg, 69%, 61%)",
            deckHueRotation: user?.deckHueRotation ?? 232,
          } as IRoomPlayer,
        } as IRoomPlayersMetadata);
      }
      setGameData({} as IGameMetadata);
      setConnectedToRoom(false);

      setResetPlayerStateUponPageLoad(false);
    }

    events.on("routeChangeComplete", handleRouteChange);

    return () => {
      events.off("routeChangeComplete", handleRouteChange);
    };
  }, [
    events,
    resetPlayerStateUponPageLoad,
    userID,
    user,
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
    setConnectedToRoom,
    setResetPlayerStateUponPageLoad,
  ]);
}

export default useResetPlayerStateUponPageLoad;
