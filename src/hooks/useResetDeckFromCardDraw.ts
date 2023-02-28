import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IDrawFromDeck } from "../pages/api/socket";

function useResetDeckFromCardDraw() {
  const { gameData, setGameData } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IDrawFromDeck | null>(
    null
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

      const { resetDeck, updatedBoard, updatedPlayerCards } = dataFromBackend;

      if (resetDeck) {
        setGameData({
          ...gameData,
          board: updatedBoard,
          players: updatedPlayerCards,
        });
      }
    }
  }, [dataFromBackend, gameData, setGameData]);
}

export default useResetDeckFromCardDraw;
