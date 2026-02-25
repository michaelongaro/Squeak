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
import {
  normalizeAvatarPath,
  normalizeCardBackVariant,
  parseAndNormalizeLocalPlayerMetadata,
} from "~/utils/playerMetadataDefaults";

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
    setShowPreFirstDeckDrawPulse,
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

      setShowPreFirstDeckDrawPulse(true);

      if (userID !== "") {
        const localStorageUsername = localStorage.getItem("squeak-username");
        const localStoragePlayerMetadata = localStorage.getItem(
          "squeak-playerMetadata",
        );

        const parsedPlayerMetadata = parseAndNormalizeLocalPlayerMetadata(
          localStoragePlayerMetadata,
        );

        localStorage.setItem(
          "squeak-playerMetadata",
          JSON.stringify(parsedPlayerMetadata),
        );

        // TODO: even if it isn't strictly used by backend, maybe include
        // the deckVariant in playerMetadata just to simplify things?

        setPlayerMetadata({
          [userID]: {
            username: user?.username ?? localStorageUsername ?? "",
            avatarPath: normalizeAvatarPath(
              user?.avatarPath ?? parsedPlayerMetadata.avatarPath,
            ),
            color: user?.color ?? parsedPlayerMetadata.color,
            cardBackVariant: normalizeCardBackVariant(
              user?.cardBackVariant ?? parsedPlayerMetadata.cardBackVariant,
            ),
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
    setShowPreFirstDeckDrawPulse,
  ]);
}

export default useResetPlayerStateUponPageLoad;
