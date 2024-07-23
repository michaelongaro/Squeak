import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
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
  const { setGameData, setQueuedCards } = useRoomContext();

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
      setQueuedCards((prevQueuedCards) => ({
        ...prevQueuedCards,
        [`${ownerID}-${value}${suit}`]: {
          value,
          suit,
        },
      }));

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
            setGameData((prevGameData) => ({
              ...prevGameData,
              players: {
                ...prevGameData.players,
                [playerID]: updatedPlayerCards,
              },
            }));

            // remove card from queued cards
            setQueuedCards((prevQueuedCards) => {
              const newQueuedCards = { ...prevQueuedCards };
              delete newQueuedCards[`${ownerID}-${value}${suit}`];
              return newQueuedCards;
            });
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
