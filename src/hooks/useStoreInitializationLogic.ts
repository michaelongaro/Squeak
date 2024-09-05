import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useUserIDContext } from "~/context/UserIDContext";
import useGetViewportLabel from "~/hooks/useGetViewportLabel";
import { socket } from "~/pages/_app";
import { type IRoomPlayer } from "~/pages/api/socket";
import { useMainStore } from "~/stores/MainStore";
import { api } from "~/utils/api";

function useStoreInitializationLogic() {
  const { isLoaded, isSignedIn } = useAuth();
  const userID = useUserIDContext();

  const { data: user } = api.users.getUserByID.useQuery(userID, {
    enabled: isSignedIn && userID !== "",
  });

  const {
    audioContext,
    setSuccessfulMoveBuffer,
    setNotAllowedMoveBuffer,
    setOtherPlayerCardMoveBuffer,
    setSqueakButtonPressBuffer,
    setConfettiPopBuffer,
    masterVolumeGainNode,
    currentVolume,
    setCurrentVolume,
    friendData,
    playerMetadata,
    setPlayerMetadata,
    roomConfig,
    setDeckVariantIndex,
    setMirrorPlayerContainer,
  } = useMainStore((state) => ({
    audioContext: state.audioContext,
    setSuccessfulMoveBuffer: state.setSuccessfulMoveBuffer,
    setNotAllowedMoveBuffer: state.setNotAllowedMoveBuffer,
    setOtherPlayerCardMoveBuffer: state.setOtherPlayerCardMoveBuffer,
    setSqueakButtonPressBuffer: state.setSqueakButtonPressBuffer,
    setConfettiPopBuffer: state.setConfettiPopBuffer,
    masterVolumeGainNode: state.masterVolumeGainNode,
    currentVolume: state.currentVolume,
    setCurrentVolume: state.setCurrentVolume,
    friendData: state.friendData,
    playerMetadata: state.playerMetadata,
    setPlayerMetadata: state.setPlayerMetadata,
    roomConfig: state.roomConfig,
    setDeckVariantIndex: state.setDeckVariantIndex,
    setMirrorPlayerContainer: state.setMirrorPlayerContainer,
  }));

  useGetViewportLabel();

  useEffect(() => {
    fetch("/api/socket");
  }, []);

  useEffect(() => {
    if (audioContext === null) return;

    const fetchAudioFile = async (path: string) => {
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      return await audioContext.decodeAudioData(arrayBuffer);
    };

    fetchAudioFile("/sounds/successfulMove.mp3").then((buffer) =>
      setSuccessfulMoveBuffer(buffer),
    );
    fetchAudioFile("/sounds/notAllowed.mp3").then((buffer) =>
      setNotAllowedMoveBuffer(buffer),
    );
    fetchAudioFile("/sounds/otherPlayerCardMove.mp3").then((buffer) =>
      setOtherPlayerCardMoveBuffer(buffer),
    );
    fetchAudioFile("/sounds/squeakButtonPress.mp3").then((buffer) =>
      setSqueakButtonPressBuffer(buffer),
    );
    fetchAudioFile("/sounds/confettiPop.mp3").then((buffer) =>
      setConfettiPopBuffer(buffer),
    );
  }, [
    audioContext,
    setConfettiPopBuffer,
    setNotAllowedMoveBuffer,
    setOtherPlayerCardMoveBuffer,
    setSqueakButtonPressBuffer,
    setSuccessfulMoveBuffer,
  ]);

  useEffect(() => {
    if (currentVolume === null || !masterVolumeGainNode) return;

    localStorage.setItem("squeak-volume", currentVolume.toString());

    const fixedVolume = currentVolume * 0.005;
    masterVolumeGainNode.gain.value = Number(fixedVolume.toFixed(2));
  }, [currentVolume, masterVolumeGainNode]);

  useEffect(() => {
    const storedVolume = localStorage.getItem("squeak-volume");

    if (storedVolume) {
      setCurrentVolume(parseFloat(storedVolume));
    } else {
      localStorage.setItem("squeak-volume", "25");
      setCurrentVolume(25);
    }
  }, [setCurrentVolume]);

  useEffect(() => {
    if (isSignedIn && userID && friendData === undefined) {
      socket.volatile.emit("initializePlayerInFriendsObj", userID);
    }
  }, [isSignedIn, userID, friendData]);

  useEffect(() => {
    if (isSignedIn) {
      socket.volatile.emit("modifyFriendData", {
        action: "roomMetadataUpdate",
        initiatorID: userID,
        currentRoomIsPublic: roomConfig.isPublic,
        currentRoomIsFull: roomConfig.playersInRoom === roomConfig.maxPlayers,
      });
    }
  }, [roomConfig, isSignedIn, userID]);

  // initializing player metadata w/ their database values (if authenticated)
  useEffect(() => {
    if (
      playerMetadata[userID] !== undefined ||
      !isLoaded ||
      !isSignedIn ||
      user === undefined ||
      userID === ""
    )
      return;

    setPlayerMetadata({
      ...playerMetadata,
      [userID]: {
        username: user ? user.username : "",
        avatarPath: user ? user.avatarPath : "/avatars/rabbit.svg",
        color: user ? user.color : "oklch(64.02% 0.171 15.38)",
        deckHueRotation: user ? user.deckHueRotation : 232,
      } as IRoomPlayer,
    });

    setDeckVariantIndex(user ? user.deckVariantIndex : 0);
    setMirrorPlayerContainer(user ? !user.squeakPileOnLeft : false);
  }, [
    userID,
    user,
    playerMetadata,
    isLoaded,
    isSignedIn,
    setDeckVariantIndex,
    setMirrorPlayerContainer,
    setPlayerMetadata,
  ]);

  // initializing player metadata w/ their database values (if not authenticated)
  useEffect(() => {
    if (
      playerMetadata[userID] !== undefined ||
      !isLoaded ||
      isSignedIn ||
      user !== null
    )
      return;

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
          color: "oklch(64.02% 0.171 15.38)",
          deckVariantIndex: 0,
          deckHueRotation: 232,
        }),
      );
    }

    // TODO: even if it isn't strictly used by backend, maybe include
    // the deckVariantIndex in playerMetadata just to simplify things?

    setPlayerMetadata({
      ...playerMetadata,
      [userID]: {
        username: localStorageUsername ?? "",
        avatarPath: parsedPlayerMetadata.avatarPath,
        color: parsedPlayerMetadata.color,
        deckHueRotation: parsedPlayerMetadata.deckHueRotation,
      } as IRoomPlayer,
    });

    setDeckVariantIndex(parsedPlayerMetadata.deckVariantIndex);
    setMirrorPlayerContainer(false);
  }, [
    userID,
    user,
    playerMetadata,
    isLoaded,
    isSignedIn,
    setDeckVariantIndex,
    setMirrorPlayerContainer,
    setPlayerMetadata,
  ]);
}

export default useStoreInitializationLogic;
