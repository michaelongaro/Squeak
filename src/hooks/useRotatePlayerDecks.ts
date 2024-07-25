import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IGameMetadata } from "./../pages/api/socket";
import { findInsertionIndex } from "~/utils/findInsertionIndex";

interface IDataFromBackend {
  timestamp: number;
  gameData: IGameMetadata;
}

function useRotatePlayerDecks() {
  const {
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
    setGameData,
    setDecksAreBeingRotated,
    setServerGameData,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IDataFromBackend | null>(null);

  useEffect(() => {
    socket.on("decksWereRotated", (data) => setDataFromBackend(data));

    return () => {
      socket.off("decksWereRotated", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { timestamp, gameData } = dataFromBackend;

      setDecksAreBeingRotated(true);

      setTimeout(() => {
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
      }, 1000);
    }
  }, [
    dataFromBackend,
    setGameData,
    setDecksAreBeingRotated,
    setServerGameData,
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
  ]);
}

export default useRotatePlayerDecks;
