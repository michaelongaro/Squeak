import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromSqueakDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";

interface IUseInitialCardDrawForSqueakStack {
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

function useInitialCardDrawForSqueakStack({
  value,
  suit,
  ownerID,
  moveCard,
}: IUseInitialCardDrawForSqueakStack) {
  const { setGameData } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IDrawFromSqueakDeck | null>(null);

  useEffect(() => {
    function handleCardDrawnFromSqueakDeck(data: IDrawFromSqueakDeck) {
      setDataFromBackend(data);
    }

    socket.on("initialCardDrawnForSqueakStack", handleCardDrawnFromSqueakDeck);

    return () => {
      socket.off(
        "initialCardDrawnForSqueakStack",
        handleCardDrawnFromSqueakDeck,
      );
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { playerID, indexToDrawTo, newCard, gameData } = dataFromBackend;

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
            setGameData(gameData);
          },
        });
      }
    }
  }, [dataFromBackend, moveCard, ownerID, setGameData, suit, value]);
}

export default useInitialCardDrawForSqueakStack;
