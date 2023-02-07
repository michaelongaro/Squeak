import { useState, useEffect } from "react";
import { socket } from "../pages";
import { type ICardDropProposal } from "../pages/api/socket";

interface IUseCardDropDenied {
  ownerID?: string;
  moveCard: (
    { x, y }: { x: number; y: number },
    flip: boolean,
    rotate: false
  ) => void;
}

function useCardDropDenied({ ownerID, moveCard }: IUseCardDropDenied) {
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

      const { playerID } = dataFromBackend;

      if (playerID === ownerID) {
        moveCard({ x: 0, y: 0 }, false, false);
      }
    }
  }, [dataFromBackend, moveCard, ownerID]);
}

export default useCardDropDenied;
