import { useState, useEffect } from "react";
import { socket } from "../pages";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromSqueakDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";

interface IUseCardDrawFromSqueakDeck {
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

function useCardDrawFromSqueakDeck({
  value,
  suit,
  ownerID,
  moveCard,
}: IUseCardDrawFromSqueakDeck) {
  const { setGameData } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IDrawFromSqueakDeck | null>(null);

  useEffect(() => {
    function handleCardDrawnFromSqueakDeck(data: IDrawFromSqueakDeck) {
      setDataFromBackend(data);
    }

    socket.on("cardDrawnFromSqueakDeck", handleCardDrawnFromSqueakDeck);

    return () => {
      socket.off("cardDrawnFromSqueakDeck", handleCardDrawnFromSqueakDeck);
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { playerID, indexToDrawTo, newCard, updatedGameData } =
        dataFromBackend;

      if (
        playerID !== ownerID ||
        newCard?.suit !== suit ||
        newCard?.value !== value
      )
        return;

      const endID = `${playerID}squeakHand${indexToDrawTo}`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      if (endLocation) {
        const endX = endLocation.x;
        const endY = endLocation.y;

        moveCard({
          newPosition: { x: endX, y: endY },
          flip: true,
          rotate: false,
          callbackFunction: () => {
            setGameData(updatedGameData);
          },
        });
      }
    }
  }, [dataFromBackend, moveCard, ownerID, setGameData, suit, value]);
}

export default useCardDrawFromSqueakDeck;
