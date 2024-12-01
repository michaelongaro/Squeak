import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";
import { useUserIDContext } from "~/context/UserIDContext";

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
  const userID = useUserIDContext();

  const {
    setGameData,
    setOtherPlayerIDsDrawingFromDeck,
    setCurrentPlayerIsDrawingFromDeck,
    fallbackPlayerIsDrawingFromDeckTimerIdRef,
    viewportLabel,
    showPreFirstDeckDrawPulse,
    setShowPreFirstDeckDrawPulse,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IDrawFromDeck | null>(
    null,
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
        cardBeingAnimated, // whatever card will be showing as top card of player's hand
        cardsInInitialPile,
        cardsInTargetPile,
        playerID,
        gameData,
      } = dataFromBackend;

      if (
        suit === undefined ||
        value === undefined ||
        ownerID !== playerID ||
        cardBeingAnimated?.value !== value ||
        cardBeingAnimated?.suit !== suit
      )
        return;

      // simulates another player drawing from their deck. This shows the little
      // "press down" animation on the deck for w/e other player is drawing from their deck
      if (ownerID !== userID) {
        setOtherPlayerIDsDrawingFromDeck((prev) => {
          return [...prev, playerID];
        });

        setTimeout(() => {
          setOtherPlayerIDsDrawingFromDeck((currentIDs) =>
            currentIDs.filter((id) => id !== ownerID),
          );
        }, 150);
      }

      const endID = `${ownerID}hand`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      // pseudo depth doesn't apply to the first card a the pile
      const adjustedCardsInTargetPile =
        cardsInTargetPile === 1 ? 0 : cardsInTargetPile;
      const adjustedCardsInInitialPile =
        cardsInInitialPile === 1 ? 0 : cardsInInitialPile;
      const dynamicMultiplier = viewportLabel.includes("mobile") ? 0.15 : 0.3;

      if (endLocation) {
        moveCard({
          newPosition: { x: endLocation.x, y: endLocation.y },
          pseudoVerticalDepthDifferential:
            (adjustedCardsInTargetPile - adjustedCardsInInitialPile) *
            dynamicMultiplier,
          flip: true,
          rotate: false,
          callbackFunction: () => {
            if (ownerID === userID) {
              setCurrentPlayerIsDrawingFromDeck(false);
              clearTimeout(fallbackPlayerIsDrawingFromDeckTimerIdRef.current);

              if (showPreFirstDeckDrawPulse) {
                setShowPreFirstDeckDrawPulse(false);
              }
            }

            setGameData(gameData);
          },
        });
      }
    }
  }, [
    dataFromBackend,
    moveCard,
    setGameData,
    rotation,
    suit,
    ownerID,
    value,
    setOtherPlayerIDsDrawingFromDeck,
    userID,
    fallbackPlayerIsDrawingFromDeckTimerIdRef,
    setCurrentPlayerIsDrawingFromDeck,
    viewportLabel,
    showPreFirstDeckDrawPulse,
    setShowPreFirstDeckDrawPulse,
  ]);
}

export default useCardDrawFromDeck;
