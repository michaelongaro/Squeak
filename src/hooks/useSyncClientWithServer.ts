import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IGameMetadata } from "../pages/api/socket";
import { useRoomContext } from "../context/RoomContext";
import { findInsertionIndex } from "~/utils/findInsertionIndex";

interface IDataFromBackend {
  timestamp: number;
  gameData: IGameMetadata;
}

function useSyncClientWithServer() {
  const {
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
    setGameData,
    setServerGameData,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IDataFromBackend | null>(null);

  useEffect(() => {
    socket.on("syncClientWithServer", (data) => setDataFromBackend(data));

    return () => {
      socket.off("syncClientWithServer", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { timestamp, gameData } = dataFromBackend;

      if (gameDataUpdatesQueue.length === 0) {
        setGameData(gameData);
        // setServerGameData(gameData);
        return;
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
  }, [
    dataFromBackend,
    setGameData,
    setServerGameData,
    gameDataUpdatesQueue,
    setGameDataUpdatesQueue,
  ]);
}

export default useSyncClientWithServer;
