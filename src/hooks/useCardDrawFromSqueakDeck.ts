import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IDrawFromSqueakDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";
import { useMainStore } from "~/stores/MainStore";

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
  const { setGameData, setQueuedCards } = useMainStore((state) => ({
    setGameData: state.setGameData,
    setQueuedCards: state.setQueuedCards,
  }));

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

      const { playerID, indexToDrawTo, newCard, updatedPlayerCards } =
        dataFromBackend;

      if (
        suit === undefined ||
        value === undefined ||
        playerID !== ownerID ||
        newCard?.suit !== suit ||
        newCard?.value !== value
      )
        return;

      // add card to queued cards
      const prevQueuedCards = useMainStore.getState().queuedCards;

      const newQueuedCards = {
        ...prevQueuedCards,
        [`${ownerID}-${value}${suit}`]: {
          value,
          suit,
        },
      };

      setQueuedCards(newQueuedCards);

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
            const prevGameData = useMainStore.getState().gameData;

            const newGameData = {
              ...prevGameData,
              players: {
                ...prevGameData.players,
                [playerID]: updatedPlayerCards,
              },
            };

            setGameData(newGameData);

            // remove card from queued cards
            const prevQueuedCards = useMainStore.getState().queuedCards;

            const newQueuedCards = { ...prevQueuedCards };
            delete newQueuedCards[`${ownerID}-${value}${suit}`];
            setQueuedCards(newQueuedCards);
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
    setQueuedCards,
  ]);
}

export default useCardDrawFromSqueakDeck;
