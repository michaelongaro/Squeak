import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromDeck } from "../pages/api/socket";
import { findInsertionIndex } from "~/utils/findInsertionIndex";

function useResetDeckFromCardDraw() {
  const {
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
    gameData,
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

      const { timestamp, resetDeck, playerID, gameData } = dataFromBackend;

      if (resetDeck) {
        if (gameDataUpdatesQueue.length === 0) {
          setGameData(gameData);
        } else {
          const index = findInsertionIndex(gameDataUpdatesQueue, timestamp);
          setGameDataUpdatesQueue((prevQueue) => {
            const newQueue = [...prevQueue];
            newQueue.splice(index, 0, [timestamp, gameData]);
            return newQueue;
          });

          setGameDataUpdatesQueue((prevQueue) => {
            // process the first game state in the queue
            const [_, gameData] = prevQueue[0]!;
            setGameData(gameData);

            // remove the first game state from the queue
            const newQueue = [...prevQueue];
            newQueue.shift();
            return newQueue;
          });
        }
      }
    }
  }, [
    dataFromBackend,
    gameData,
    setGameData,
    setServerGameData,
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
  ]);
}

export default useResetDeckFromCardDraw;
