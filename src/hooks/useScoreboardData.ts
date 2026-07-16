import { useState, useEffect, useRef } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IScoreboardMetadata } from "~/types/socket";
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
  const scoreboardTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleScoreboardMetadata(
      data: IScoreboardMetadataWithSqueakSound,
    ) {
      setDataFromBackend(data);
    }

    socket.on("scoreboardMetadata", handleScoreboardMetadata);

    return () => {
      socket.off("scoreboardMetadata", handleScoreboardMetadata);
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
        userID !== roundWinnerID &&
        userID !== gameWinnerID &&
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

      if (scoreboardTimeoutRef.current) {
        clearTimeout(scoreboardTimeoutRef.current);
      }

      scoreboardTimeoutRef.current = setTimeout(
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

  useEffect(() => {
    return () => {
      if (scoreboardTimeoutRef.current) {
        clearTimeout(scoreboardTimeoutRef.current);
      }
    };
  }, []);
}

export default useScoreboardData;
