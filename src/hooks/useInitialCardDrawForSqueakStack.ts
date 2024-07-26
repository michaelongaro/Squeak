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

function useInitialCardDrawForSqueakStack() {
  const { setGameData, queuedCardMoves, setQueuedCardMoves } = useMainStore(
    (state) => ({
      setGameData: state.setGameData,
      queuedCardMoves: state.queuedCardMoves,
      setQueuedCardMoves: state.setQueuedCardMoves,
    }),
  );

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

      if (!newCard) return;

      // if (
      //   playerID !== ownerID ||
      //   newCard?.suit !== suit ||
      //   newCard?.value !== value
      // )
      //   return;

      const endID = `${playerID}squeakHand${indexToDrawTo}`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      const cardID = `${playerID}${newCard.value}${newCard.suit}`;

      if (endLocation) {
        // queue card to be moved
        const newQueuedCardMoves = { ...queuedCardMoves };

        newQueuedCardMoves[cardID] = {
          newPosition: { x: endLocation.x, y: endLocation.y },
          flip: true,
          rotate: false,
          callbackFunction: () => {
            setGameData(gameData);
          },
        };

        setQueuedCardMoves(newQueuedCardMoves);

        // moveCard({
        //   newPosition: { x: endX, y: endY },
        //   flip: true,
        //   rotate: false,
        //   callbackFunction: () => {
        //     const prevGameData = useMainStore.getState().gameData;

        //     const newGameData = {
        //       ...prevGameData,
        //       players: {
        //         ...prevGameData.players,
        //         [playerID]: updatedPlayerCards,
        //       },
        //     };

        //     setGameData(newGameData);
        //   },
        // });
      }
    }
  }, [dataFromBackend, setGameData, queuedCardMoves, setQueuedCardMoves]);
}

export default useInitialCardDrawForSqueakStack;
