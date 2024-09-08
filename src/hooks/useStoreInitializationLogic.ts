import { useAuth } from "@clerk/nextjs";
import cryptoRandomString from "crypto-random-string";
import { useEffect } from "react";
import useGetViewportLabel from "~/hooks/useGetViewportLabel";
import { socket } from "~/pages/_app";
import { type IRoomPlayer } from "~/pages/api/socket";
import { useMainStore } from "~/stores/MainStore";
import { api } from "~/utils/api";

function useStoreInitializationLogic() {
  const { userId, isLoaded, isSignedIn } = useAuth();

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
    setPlayerMetadata,
    roomConfig,
    setDeckVariantIndex,
    setMirrorPlayerContainer,
    getPlayerMetadata,
    userID,
    setUserID,
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
    setPlayerMetadata: state.setPlayerMetadata,
    roomConfig: state.roomConfig,
    setDeckVariantIndex: state.setDeckVariantIndex,
    setMirrorPlayerContainer: state.setMirrorPlayerContainer,
    getPlayerMetadata: state.getPlayerMetadata,
    userID: state.userID,
    setUserID: state.setUserID,
  }));

  const { data: user } = api.users.getUserByID.useQuery(userID, {
    enabled: isSignedIn && userID !== "",
  });

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
    if (!isLoaded) return;

    if (!userId) {
      let userID: string;
      if (localStorage.getItem("squeak-userID") === null) {
        userID = cryptoRandomString({ length: 16 });
        localStorage.setItem("squeak-userID", userID);
      } else {
        userID = localStorage.getItem("squeak-userID") as string;
      }
      setUserID(userID);
    } else {
      if (localStorage.getItem("squeak-userID") !== null) {
        localStorage.removeItem("squeak-userID");
      }
      setUserID(userId);
    }
  }, [userId, isLoaded, setUserID]);

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
      getPlayerMetadata()[userID] !== undefined ||
      !isLoaded ||
      !isSignedIn ||
      user === undefined ||
      userID === ""
    )
      return;

    setPlayerMetadata({
      // ...playerMetadata,
      ...getPlayerMetadata(),
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
    // playerMetadata,
    isLoaded,
    isSignedIn,
    setDeckVariantIndex,
    setMirrorPlayerContainer,
    setPlayerMetadata,
    getPlayerMetadata,
  ]);

  // initializing player metadata w/ their database values (if not authenticated)
  useEffect(() => {
    if (
      getPlayerMetadata()[userID] !== undefined ||
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
      // ...playerMetadata,
      ...getPlayerMetadata(),
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
    // playerMetadata,
    isLoaded,
    isSignedIn,
    setDeckVariantIndex,
    setMirrorPlayerContainer,
    setPlayerMetadata,
    getPlayerMetadata,
  ]);
}

export default useStoreInitializationLogic;
