import { useState, useEffect } from "react";
import { socket } from "../pages";
import { type ICardDropProposal } from "../pages/api/socket";

interface IUseCardDropDenied {
  ownerID?: string;
  moveCard: ({ x, y }: { x: number; y: number }, flip: boolean) => void;
}

function useCardDropDenied({
  ownerID,

  moveCard,
}: IUseCardDropDenied) {
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
      setDataFromBackend(null); // if this doesn't work then move it to the end of the function

      console.log("executing useEffect in useCardDropDenied");

      const { playerID } = dataFromBackend;

      if (playerID === ownerID) {
        // red box shadow stuff here
        moveCard({ x: 0, y: 0 }, false);
      }
    }
  }, [dataFromBackend, moveCard, ownerID]);
}

export default useCardDropDenied;
