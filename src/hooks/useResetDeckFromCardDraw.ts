import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromDeck } from "../pages/api/socket";

function useResetDeckFromCardDraw() {
  const { gameData, setGameData, setServerGameData } = useRoomContext();

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

      const { resetDeck, playerID, updatedPlayerCards } = dataFromBackend;

      if (resetDeck) {
        setGameData((prevGameData) => ({
          ...prevGameData,
          players: {
            ...prevGameData.players,
            [playerID]: updatedPlayerCards,
          },
        }));

        setServerGameData((prevServerGameData) => ({
          ...prevServerGameData,
          players: {
            ...prevServerGameData.players,
            [playerID]: updatedPlayerCards,
          },
        }));
      }
    }
  }, [dataFromBackend, gameData, setGameData, setServerGameData]);
}

export default useResetDeckFromCardDraw;
