import { useState, useEffect } from "react";
import { socket } from "~/lib/socket";
import { type ICardDropProposal } from "~/types/socket";
import { useRoomContext } from "../context/RoomContext";
import { type IMoveCard } from "../components/Play/Card";

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
    useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<Partial<ICardDropProposal> | null>(null);

  useEffect(() => {
    const handleEvent = (data: NonNullable<typeof dataFromBackend>) => {
      if (
        data.playerID === ownerID &&
        data.card?.value === value &&
        data.card?.suit === suit
      ) {
        setDataFromBackend(data);
      }
    };
    socket.on("cardDropDenied", handleEvent);

    return () => {
      socket.off("cardDropDenied", handleEvent);
    };
  }, [ownerID, value, suit]);

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
