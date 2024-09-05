import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IDrawFromDeck } from "../pages/api/socket";
import { useMainStore } from "~/stores/MainStore";

function useResetDeckFromCardDraw() {
  const { gameData, setGameData } = useMainStore((state) => ({
    gameData: state.gameData,
    setGameData: state.setGameData,
  }));

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
