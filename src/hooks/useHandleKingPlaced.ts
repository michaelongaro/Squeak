import { useState, useEffect } from "react";
import { socket } from "../pages";
import { type ICardDropProposal } from "../pages/api/socket";

interface IUseHandleKingPlaced {
  value?: string;
  suit?: string;
  ownerID?: string;
  flipKing: () => void;
}

function useHandleKingPlaced({
  value,
  suit,
  ownerID,
  flipKing,
}: IUseHandleKingPlaced) {
  const [dataFromBackend, setDataFromBackend] =
    useState<Partial<ICardDropProposal> | null>(null);

  useEffect(() => {
    socket.on("kingWasPlaced", (data) => setDataFromBackend(data));

    return () => {
      socket.off("kingWasPlaced", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { playerID, card } = dataFromBackend;

      if (
        playerID === ownerID &&
        card?.suit === suit &&
        card?.value === value
      ) {
        flipKing();
      }
    }
  }, [dataFromBackend, flipKing, ownerID, suit, value]);
}

export default useHandleKingPlaced;
