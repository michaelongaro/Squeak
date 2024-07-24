import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import { useMainStore } from "~/stores/MainStore";
import useGetUserID from "~/hooks/useGetUserID";

function useInitializeStoreLogic() {
  const { isLoaded, isSignedIn } = useAuth();
  const userID = useGetUserID();
  const user = api.users.getUserByID.useQuery(userID).data;

  const {
    audioContext,
    masterVolumeGainNode,
    prefersSimpleCardAssets,
    playerMetadata,
    currentVolume,
    roomConfig,
    friendData,
    setFriendData,
    setAudioContext,
    setMasterVolumeGainNode,
    setSuccessfulMoveBuffer,
    setNotAllowedMoveBuffer,
    setOtherPlayerCardMoveBuffer,
    setSqueakButtonPressBuffer,
    setConfettiPopBuffer,
    setPrefersSimpleCardAssets,
    setMirrorPlayerContainer,
    setPlayerMetadata,
  } = useMainStore((state) => ({
    audioContext: state.audioContext,
    masterVolumeGainNode: state.masterVolumeGainNode,
    prefersSimpleCardAssets: state.prefersSimpleCardAssets,
    playerMetadata: state.playerMetadata,
    currentVolume: state.currentVolume,
    roomConfig: state.roomConfig,
    friendData: state.friendData,
    setFriendData: state.setFriendData,
    setAudioContext: state.setAudioContext,
    setMasterVolumeGainNode: state.setMasterVolumeGainNode,
    setSuccessfulMoveBuffer: state.setSuccessfulMoveBuffer,
    setNotAllowedMoveBuffer: state.setNotAllowedMoveBuffer,
    setOtherPlayerCardMoveBuffer: state.setOtherPlayerCardMoveBuffer,
    setSqueakButtonPressBuffer: state.setSqueakButtonPressBuffer,
    setConfettiPopBuffer: state.setConfettiPopBuffer,
    setPrefersSimpleCardAssets: state.setPrefersSimpleCardAssets,
    setMirrorPlayerContainer: state.setMirrorPlayerContainer,
    setPlayerMetadata: state.setPlayerMetadata,
  }));

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
    if (audioContext && masterVolumeGainNode) return;
    const newAudioContext = new AudioContext();
    const newMasterVolumeGainNode = newAudioContext.createGain();
    newMasterVolumeGainNode.connect(newAudioContext.destination);
    setAudioContext(newAudioContext);
    setMasterVolumeGainNode(newMasterVolumeGainNode);
  }, [
    audioContext,
    masterVolumeGainNode,
    setAudioContext,
    setMasterVolumeGainNode,
  ]);

  useEffect(() => {
    if (userID && friendData === undefined) {
      socket.emit("initializePlayerInFriendsObj", userID);
    }
  }, [userID, friendData]);

  useEffect(() => {
    if (prefersSimpleCardAssets === null) return;
    localStorage.setItem(
      "squeakPrefersSimpleCardAssets",
      prefersSimpleCardAssets.toString(),
    );
  }, [prefersSimpleCardAssets]);

  useEffect(() => {
    if (currentVolume === null || !masterVolumeGainNode) return;
    localStorage.setItem("squeakVolume", currentVolume.toString());
    const fixedVolume = currentVolume * 0.01;
    masterVolumeGainNode.gain.value = Number(fixedVolume.toFixed(2));
  }, [currentVolume, masterVolumeGainNode]);

  useEffect(() => {
    if (isSignedIn) {
      socket.emit("modifyFriendData", {
        action: "roomMetadataUpdate",
        initiatorID: userID,
        currentRoomIsPublic: roomConfig.isPublic,
        currentRoomIsFull: roomConfig.playersInRoom === roomConfig.maxPlayers,
      });
    }
  }, [roomConfig, isSignedIn, userID]);

  // TODO: are both of these needed below or can you combine into one?

  useEffect(() => {
    if (
      playerMetadata[userID] !== undefined ||
      !isLoaded ||
      !isSignedIn ||
      user === undefined ||
      userID === ""
    )
      return;

    const newPlayerMetadata = {
      ...playerMetadata,
      [userID]: {
        username: user ? user.username : "",
        avatarPath: user ? user.avatarPath : "/avatars/rabbit.svg",
        color: user ? user.color : "hsl(352deg, 69%, 61%)",
        deckHueRotation: user ? user.deckHueRotation : 232,
      },
    };

    setPlayerMetadata(newPlayerMetadata);

    setPrefersSimpleCardAssets(user ? user.prefersSimpleCardAssets : false);
    setMirrorPlayerContainer(user ? !user.squeakPileOnLeft : false);
  }, [
    userID,
    user,
    playerMetadata,
    isLoaded,
    isSignedIn,
    setMirrorPlayerContainer,
    setPlayerMetadata,
    setPrefersSimpleCardAssets,
  ]);

  useEffect(() => {
    if (
      playerMetadata[userID] !== undefined ||
      !isLoaded ||
      isSignedIn ||
      user !== null
    )
      return;

    const newPlayerMetadata = {
      ...playerMetadata,
      [userID]: {
        username: "",
        avatarPath: "/avatars/rabbit.svg",
        color: "hsl(352deg, 69%, 61%)",
        deckHueRotation: 232,
      },
    };

    setPlayerMetadata(newPlayerMetadata);

    setPrefersSimpleCardAssets(false);
    setMirrorPlayerContainer(false);
  }, [
    userID,
    user,
    playerMetadata,
    isLoaded,
    isSignedIn,
    setMirrorPlayerContainer,
    setPlayerMetadata,
    setPrefersSimpleCardAssets,
  ]);
}

export default useInitializeStoreLogic;
