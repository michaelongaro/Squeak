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

  const { data: user } = api.users.getUserByID.useQuery(userID, {
    enabled: userID !== "",
  });

  const {
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
    setConnectedToRoom,
    resetPlayerStateUponPageLoad,
    setResetPlayerStateUponPageLoad,
    setCardsBeingMovedProgrammatically,
  } = useRoomContext();

  useEffect(() => {
    function handleRouteChange() {
      if (!resetPlayerStateUponPageLoad) return;

      setRoomConfig({
        pointsToWin: 100,
        maxPlayers: 5,
        playersInRoom: 1,
        playerIDsInRoom: [userID],
        isPublic: true,
        code: "",
        hostUsername: "",
        hostUserID: "",
        gameStarted: false,
      });

      setCardsBeingMovedProgrammatically({
        hand: [],
        deck: [],
        squeakDeck: [],
      });

      if (userID !== "") {
        const localStorageUsername = localStorage.getItem("squeak-username");
        const localStoragePlayerMetadata = localStorage.getItem(
          "squeak-playerMetadata",
        );

        let parsedPlayerMetadata: {
          avatarPath: string;
          color: string;
          deckVariantIndex: number;
          deckHueRotation: number;
        } = {
          avatarPath: "/avatars/rabbit.svg",
          color: "oklch(64.02% 0.171 15.38)",
          deckVariantIndex: 0,
          deckHueRotation: 232,
        };

        if (localStoragePlayerMetadata) {
          parsedPlayerMetadata = JSON.parse(localStoragePlayerMetadata);
        } else {
          localStorage.setItem(
            "squeak-playerMetadata",
            JSON.stringify({
              avatarPath: "/avatars/rabbit.svg",
              deckVariantIndex: 0,
              deckHueRotation: 232,
            }),
          );
        }

        // TODO: even if it isn't strictly used by backend, maybe include
        // the deckVariantIndex in playerMetadata just to simplify things?

        setPlayerMetadata({
          [userID]: {
            username: user?.username ?? localStorageUsername ?? "",
            avatarPath: user?.avatarPath ?? parsedPlayerMetadata.avatarPath,
            color: user?.color ?? parsedPlayerMetadata.color,
            deckHueRotation:
              user?.deckHueRotation ?? parsedPlayerMetadata.deckHueRotation,
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
    setCardsBeingMovedProgrammatically,
  ]);
}

export default useResetPlayerStateUponPageLoad;
