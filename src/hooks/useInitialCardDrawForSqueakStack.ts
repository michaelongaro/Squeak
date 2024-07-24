import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IDrawFromSqueakDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";
import { useMainStore } from "~/stores/MainStore";

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
  const { setGameData } = useMainStore((state) => ({
    setGameData: state.setGameData,
  }));

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

      const { playerID, indexToDrawTo, newCard, updatedPlayerCards } =
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
            const prevGameData = useMainStore.getState().gameData;

            const newGameData = {
              ...prevGameData,
              players: {
                ...prevGameData.players,
                [playerID]: updatedPlayerCards,
              },
            };

            setGameData(newGameData);
          },
        });
      }
    }
  }, [dataFromBackend, moveCard, ownerID, setGameData, suit, value]);
}

export default useInitialCardDrawForSqueakStack;
