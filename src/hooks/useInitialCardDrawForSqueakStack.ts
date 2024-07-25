import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromSqueakDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";
import { findInsertionIndex } from "~/utils/findInsertionIndex";

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
  const {
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
    setGameData,
    setServerGameData,
  } = useRoomContext();

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

      const { timestamp, playerID, indexToDrawTo, newCard, gameData } =
        dataFromBackend;

      if (
        playerID !== ownerID ||
        newCard?.suit !== suit ||
        newCard?.value !== value
      )
        return;

      // setServerGameData((prevServerGameData) => ({
      //   ...prevServerGameData,
      //   players: {
      //     ...prevServerGameData.players,
      //     [playerID]: updatedPlayerCards,
      //   },
      // }));

      const index = findInsertionIndex(gameDataUpdatesQueue, timestamp);
      setGameDataUpdatesQueue((prevQueue) => {
        const newQueue = [...prevQueue];
        newQueue.splice(index, 0, [timestamp, gameData]);
        return newQueue;
      });

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
            // setGameData((prevGameData) => ({
            //   ...prevGameData,
            //   players: {
            //     ...prevGameData.players,
            //     [playerID]: updatedPlayerCards,
            //   },
            // }));

            setGameDataUpdatesQueue((prevQueue) => {
              // process the first game state in the queue
              const [_, gameData] = prevQueue[0]!;
              setGameData(gameData);

              // remove the first game state from the queue
              const newQueue = [...prevQueue];
              newQueue.shift();
              return newQueue;
            });
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
    setServerGameData,
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
  ]);
}

export default useInitialCardDrawForSqueakStack;
