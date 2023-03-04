import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IDrawFromDeck } from "../pages/api/socket";

interface IUseCardDrawFromDeck {
  value?: string;
  suit?: string;
  ownerID?: string;
  rotation: number;
  moveCard: (
    { x, y }: { x: number; y: number },
    flip: boolean,
    rotate: boolean,
    callbackFunction?: () => void
  ) => void;
}

function useCardDrawFromDeck({
  value,
  suit,
  ownerID,
  rotation,
  moveCard,
}: IUseCardDrawFromDeck) {
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

      const {
        nextTopCardInDeck: currentTopCardInDeck, // is actually referencing the current top card in deck
        playerID,
        updatedPlayerCards,
      } = dataFromBackend;

      if (
        ownerID !== playerID ||
        currentTopCardInDeck?.value !== value ||
        currentTopCardInDeck?.suit !== suit
      )
        return;

      const endID = `${ownerID}hand`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      if (endLocation) {
        let endX = endLocation.x;
        let endY = endLocation.y;

        if (rotation === 0) {
          endY -= 4;
        } else if (rotation === 90) {
          endX += 4;
        } else if (rotation === 180) {
          endY += 4;
        } else if (rotation === 270) {
          endX -= 4;
        }

        moveCard({ x: endX, y: endY }, true, false, () => {
          setGameData((prevGameData) => ({
            ...prevGameData,
            players: {
              ...prevGameData.players,
              [playerID]: updatedPlayerCards,
            },
          }));
        });
      }
    }
  }, [
    dataFromBackend,
    moveCard,
    gameData,
    setGameData,
    rotation,
    suit,
    ownerID,
    value,
  ]);
}

export default useCardDrawFromDeck;
