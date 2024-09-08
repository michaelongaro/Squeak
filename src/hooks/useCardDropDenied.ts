import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type ICardDropProposal } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";
import { useMainStore } from "~/stores/MainStore";

interface IUseCardDropDenied {
  value?: string;
  suit?: string;
  ownerID?: string;
  moveCard: ({
    newPosition,
    flip,
    rotate,
    callbackFunction,
  }: IMoveCard) => void;
}

function useCardDropDenied({
  value,
  suit,
  ownerID,
  moveCard,
}: IUseCardDropDenied) {
  const { audioContext, masterVolumeGainNode, notAllowedMoveBuffer } =
    useMainStore((state) => ({
      audioContext: state.audioContext,
      masterVolumeGainNode: state.masterVolumeGainNode,
      notAllowedMoveBuffer: state.notAllowedMoveBuffer,
    }));

  const [dataFromBackend, setDataFromBackend] =
    useState<Partial<ICardDropProposal> | null>(null);

  useEffect(() => {
    socket.on("cardDropDenied", (data) => setDataFromBackend(data));

    return () => {
      socket.off("cardDropDenied", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { playerID, card } = dataFromBackend;

      if (playerID !== ownerID || card?.value !== value || card?.suit !== suit)
        return;

      if (audioContext && masterVolumeGainNode) {
        const source = audioContext.createBufferSource();
        source.buffer = notAllowedMoveBuffer;
        source.detune.value = -650;

        source.connect(masterVolumeGainNode);
        source.start();
      }

      moveCard({
        newPosition: { x: 0, y: 0 },
        flip: false,
        rotate: false,
      });
    }
  }, [
    dataFromBackend,
    moveCard,
    ownerID,
    audioContext,
    masterVolumeGainNode,
    notAllowedMoveBuffer,
    suit,
    value,
  ]);
}

export default useCardDropDenied;
