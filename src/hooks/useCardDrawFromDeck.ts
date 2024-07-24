import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IDrawFromDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";
import { useMainStore } from "~/stores/MainStore";

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
  const { setGameData, setQueuedCards } = useMainStore((state) => ({
    setGameData: state.setGameData,
    setQueuedCards: state.setQueuedCards,
  }));

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
        playerID,
        updatedPlayerCards,
      } = dataFromBackend;

      if (
        suit === undefined ||
        value === undefined ||
        ownerID !== playerID ||
        cardBeingAnimated?.value !== value ||
        cardBeingAnimated?.suit !== suit
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
    setGameData,
    rotation,
    suit,
    ownerID,
    value,
    setQueuedCards,
  ]);
}

export default useCardDrawFromDeck;
