import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IDrawFromDeck } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";
import { useMainStore } from "~/stores/MainStore";

interface IUseCardDrawFromDeck {
  value?: string;
  suit?: string;
  ownerID?: string;
  rotation: number;
  moveCard: ({
    newPosition,
    flip,
    rotate,
    callbackFunction,
  }: IMoveCard) => void;
}

function useCardDrawFromDeck({
  value,
  suit,
  ownerID,
  rotation,
  moveCard,
}: IUseCardDrawFromDeck) {
  const {
    setGameData,
    otherPlayerIDsDrawingFromDeck,
    setOtherPlayerIDsDrawingFromDeck,
    userID,
  } = useMainStore((state) => ({
    setGameData: state.setGameData,
    otherPlayerIDsDrawingFromDeck: state.otherPlayerIDsDrawingFromDeck,
    setOtherPlayerIDsDrawingFromDeck: state.setOtherPlayerIDsDrawingFromDeck,
    userID: state.userID,
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

      const {
        cardBeingAnimated, // whatever card will be showing as top card of player's hand
        playerID,
        gameData,
      } = dataFromBackend;

      if (
        suit === undefined ||
        value === undefined ||
        ownerID !== playerID ||
        cardBeingAnimated?.value !== value ||
        cardBeingAnimated?.suit !== suit
      )
        return;

      if (ownerID !== userID) {
        setOtherPlayerIDsDrawingFromDeck([
          ...otherPlayerIDsDrawingFromDeck,
          playerID,
        ]);

        setTimeout(() => {
          setOtherPlayerIDsDrawingFromDeck(
            otherPlayerIDsDrawingFromDeck.filter((id) => id !== ownerID),
          );
        }, 100);
      }

      const endID = `${ownerID}hand`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      if (endLocation) {
        moveCard({
          newPosition: { x: endLocation.x, y: endLocation.y },
          flip: true,
          rotate: false,
          callbackFunction: () => {
            setGameData(gameData);
          },
        });
      }
    }
  }, [
    dataFromBackend,
    moveCard,
    setGameData,
    rotation,
    suit,
    ownerID,
    value,
    setOtherPlayerIDsDrawingFromDeck,
    otherPlayerIDsDrawingFromDeck,
    userID,
  ]);
}

export default useCardDrawFromDeck;
