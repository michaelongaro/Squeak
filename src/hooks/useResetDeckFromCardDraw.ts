import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type IDrawFromDeck } from "../pages/api/socket";
import { useUserIDContext } from "~/context/UserIDContext";

function useResetDeckFromCardDraw() {
  const userID = useUserIDContext();
  const { setOtherPlayerIDsDrawingFromDeck, setGameData } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IDrawFromDeck | null>(
    null,
  );

  useEffect(() => {
    socket.on("resetDeckFromCardDraw", (data) => setDataFromBackend(data));

    return () => {
      socket.off("resetDeckFromCardDraw", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { playerID, gameData } = dataFromBackend;

      // maybe do this below:
      if (playerID !== userID) {
        setOtherPlayerIDsDrawingFromDeck((prev) => [...prev, playerID]);

        setTimeout(() => {
          setOtherPlayerIDsDrawingFromDeck((currentIDs) =>
            currentIDs.filter((id) => id !== playerID),
          );
        }, 75);
      }

      const playersHandContainer = document.getElementById(`${playerID}hand`);

      if (!playersHandContainer) return;

      playersHandContainer.style.transition = "all 0.15s ease-in-out";
      playersHandContainer.style.opacity = "0";
      playersHandContainer.style.transform = "scale(0.75)";

      setTimeout(() => {
        setGameData(gameData);
        playersHandContainer.style.opacity = "1";
        playersHandContainer.style.transform = "scale(1)";
      }, 150);
    }
  }, [dataFromBackend, setGameData, setOtherPlayerIDsDrawingFromDeck, userID]);
}

export default useResetDeckFromCardDraw;
