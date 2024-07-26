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

function useCardDrawFromDeck() {
  const { setGameData, queuedCardMoves, setQueuedCardMoves } = useMainStore(
    (state) => ({
      setGameData: state.setGameData,
      queuedCardMoves: state.queuedCardMoves,
      setQueuedCardMoves: state.setQueuedCardMoves,
    }),
  );

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
        gameData,
      } = dataFromBackend;

      if (!cardBeingAnimated) return;

      // if (
      //   // suit === undefined ||
      //   // value === undefined ||
      //   // ownerID !== playerID ||
      //   cardBeingAnimated?.value !== value ||
      //   cardBeingAnimated?.suit !== suit
      // )
      //   return;

      const endID = `${playerID}hand`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      const cardID = `${playerID}${cardBeingAnimated.value}${cardBeingAnimated.suit}`;

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
        //   newPosition: { x: endLocation.x, y: endLocation.y },
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

        //     // remove card from queued cards
        //     const prevQueuedCards = useMainStore.getState().queuedCards;

        //     const newQueuedCards = { ...prevQueuedCards };
        //     delete newQueuedCards[`${ownerID}-${value}${suit}`];
        //     setQueuedCardMoves(newQueuedCards);
        //   },
        // });
      }
    }
  }, [dataFromBackend, setGameData, queuedCardMoves, setQueuedCardMoves]);
}

export default useCardDrawFromDeck;
