import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromDeck } from "../pages/api/socket";

function useResetDeckFromCardDraw() {
  const { gameData, setGameData } = useRoomContext();

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

      const { resetDeck, playerID, gameData } = dataFromBackend;

      if (resetDeck) {
        setGameData(gameData);
      }
    }
  }, [dataFromBackend, gameData, setGameData]);
}

export default useResetDeckFromCardDraw;
