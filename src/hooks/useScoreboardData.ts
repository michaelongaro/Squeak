import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IScoreboardMetadata } from "../pages/api/handlers/roundOverHandler";
import toast from "react-hot-toast";

interface IScoreboardMetadataWithSqueakSound extends IScoreboardMetadata {
  playSqueakSound: boolean;
}

function useScoreboardData() {
  const userID = useUserIDContext();

  const {
    audioContext,
    masterVolumeGainNode,
    squeakButtonPressBuffer,
    roomConfig,
    setGameData,
    setScoreboardMetadata,
    setShowScoreboard,
    setPlayerIDWhoSqueaked,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IScoreboardMetadataWithSqueakSound | null>(null);

  useEffect(() => {
    socket.on("scoreboardMetadata", (data) => setDataFromBackend(data));

    return () => {
      socket.off("scoreboardMetadata", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const {
        playSqueakSound,
        gameWinnerID,
        roundWinnerID,
        playerRoundDetails,
      } = dataFromBackend;

      if (
        playSqueakSound &&
        (userID !== roundWinnerID || userID !== gameWinnerID) &&
        audioContext &&
        masterVolumeGainNode
      ) {
        const squeakButtonPressSoundSource = audioContext.createBufferSource();
        squeakButtonPressSoundSource.buffer = squeakButtonPressBuffer;

        squeakButtonPressSoundSource.connect(masterVolumeGainNode);
        squeakButtonPressSoundSource.start();
      }

      setPlayerIDWhoSqueaked(roundWinnerID);

      toast.dismiss(); // in case there is voting toast still up

      setTimeout(
        () => {
          setScoreboardMetadata({
            gameWinnerID,
            roundWinnerID,
            playerRoundDetails,
          });

          setShowScoreboard(true);
        },
        playSqueakSound ? 1000 : 0,
      ); // waiting for pulsing animation to finish
    }
  }, [
    dataFromBackend,
    roomConfig,
    userID,
    setGameData,
    setPlayerIDWhoSqueaked,
    setScoreboardMetadata,
    setShowScoreboard,
    audioContext,
    masterVolumeGainNode,
    squeakButtonPressBuffer,
  ]);
}

export default useScoreboardData;
