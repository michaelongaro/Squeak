import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IDrawFromDeck } from "../pages/api/socket";

interface IUseCardDrawFromDeck {
  value?: string;
  suit?: string;
  ownerID?: string;
  moveCard: ({ x, y }: { x: number; y: number }, flip: boolean) => void;
}

function useCardDrawFromDeck({
  value,
  suit,
  ownerID,
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
      setDataFromBackend(null); // if this doesn't work then move it to the end of the function

      const {
        nextTopCardInDeck: currentTopCardInDeck, // is actually referencing the current top card in deck
        playerID,
        updatedBoard,
        updatedPlayerCards,
      } = dataFromBackend;

      // I think this logic checks out
      if (ownerID === playerID && currentTopCardInDeck === null) {
        console.log("next top card in deck was null");

        setGameData({
          ...gameData,
          board: updatedBoard,
          players: updatedPlayerCards,
        });
        return;
      }

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

      console.log("endLocation", endLocation);

      if (endLocation) {
        const endX = endLocation.x;
        const endY = endLocation.y;

        moveCard({ x: endX, y: endY }, true);

        setTimeout(() => {
          setGameData({
            ...gameData,
            board: updatedBoard,
            players: updatedPlayerCards,
          });
        }, 250);
      }
    }
  }, [dataFromBackend, moveCard, gameData, setGameData, suit, ownerID, value]);
}

export default useCardDrawFromDeck;
