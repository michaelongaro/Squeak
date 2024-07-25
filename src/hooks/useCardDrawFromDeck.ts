import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";
import { findInsertionIndex } from "~/utils/findInsertionIndex";

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
  const {
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
    setGameData,
    setServerGameData,
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
        timestamp,
        cardBeingAnimated, // whatever card will be showing as top card of player's hand
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
    setGameData,
    rotation,
    suit,
    ownerID,
    value,
    setServerGameData,
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
  ]);
}

export default useCardDrawFromDeck;
