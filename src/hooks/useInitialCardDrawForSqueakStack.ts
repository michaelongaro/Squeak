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
  const { setGameData, viewportLabel } = useRoomContext();

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

      const {
        playerID,
        indexToDrawTo,
        cardsInInitialPile,
        cardsInTargetPile,
        newCard,
        gameData,
      } = dataFromBackend;

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

        // fyi: no need to do the special adjustments for the "pseudoVerticalDepthDifferential"
        // like in all other card movement hooks, since there can never be just one card
        // in the initial pile or the target pile when drawing initial cards for the squeak stack

        const dynamicMultiplier = viewportLabel.includes("mobile") ? 0.15 : 0.3;

        moveCard({
          newPosition: { x: endX, y: endY },
          pseudoVerticalDepthDifferential:
            (cardsInTargetPile - cardsInInitialPile) * dynamicMultiplier,
          flip: true,
          rotate: false,
          callbackFunction: () => {
            setGameData(gameData);
          },
        });
      }
    }
  }, [
    dataFromBackend,
    moveCard,
    ownerID,
    setGameData,
    suit,
    value,
    viewportLabel,
  ]);
}

export default useInitialCardDrawForSqueakStack;
