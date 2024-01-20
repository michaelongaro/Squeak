import { useState, useEffect } from "react";
import { socket } from "../pages";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";

interface IUseCardDrawFromDeck {
  value?: string;
  suit?: string;
  ownerID?: string;
  rotation: number;
  moveCard: ({
    newPosition,
    flip,
    rotate,
    callbackFunction,
  }: IMoveCard) => void;
}

function useCardDrawFromDeck({
  value,
  suit,
  ownerID,
  rotation,
  moveCard,
}: IUseCardDrawFromDeck) {
  const { setGameData } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IDrawFromDeck | null>(
    null
  );

  useEffect(() => {
    socket.on("playerDrawnFromDeck", (data) => setDataFromBackend(data));

    return () => {
      socket.off("playerDrawnFromDeck", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const {
        nextTopCardInDeck: currentTopCardInDeck, // is actually referencing the current top card in deck
        playerID,
        updatedGameData,
      } = dataFromBackend;

      if (
        ownerID !== playerID ||
        currentTopCardInDeck?.value !== value ||
        currentTopCardInDeck?.suit !== suit
      )
        return;

      const endID = `${ownerID}hand`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      if (endLocation) {
        moveCard({
          newPosition: { x: endLocation.x, y: endLocation.y },
          flip: true,
          rotate: false,
          callbackFunction: () => {
            setGameData(updatedGameData);
          },
        });
      }
    }
  }, [dataFromBackend, moveCard, setGameData, rotation, suit, ownerID, value]);
}

export default useCardDrawFromDeck;
