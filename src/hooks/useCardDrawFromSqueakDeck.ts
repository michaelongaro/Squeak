import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IPlayer, type IDrawFromSqueakDeck } from "../pages/api/socket";
import { type ICard } from "../utils/generateDeckAndSqueakCards";

interface IUseCardDrawFromSqueakDeck {
  value?: string;
  suit?: string;
  ownerID?: string;
  moveCard: (
    { x, y }: { x: number; y: number },
    flip: boolean,
    rotate: boolean,
    newPlayerCards?: IPlayer,
    newBoard?: (ICard | null)[][]
    // callbackFunction?: () => void,
  ) => void;
}

function useCardDrawFromSqueakDeck({
  value,
  suit,
  ownerID,
  moveCard,
}: IUseCardDrawFromSqueakDeck) {
  const { gameData, setGameData } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IDrawFromSqueakDeck | null>(null);

  useEffect(() => {
    socket.on("cardDrawnFromSqueakDeck", (data) => setDataFromBackend(data));

    return () => {
      socket.off("cardDrawnFromSqueakDeck", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { playerID, indexToDrawTo, newCard, updatedPlayerCards } =
        dataFromBackend;

      if (
        playerID !== ownerID ||
        newCard?.suit !== suit ||
        newCard?.value !== value
      )
        return;

      const endID = `${playerID}squeakHand${indexToDrawTo}`;

      console.log("endID: ", endID);

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      if (endLocation) {
        const endX = endLocation.x;
        const endY = endLocation.y;

        moveCard(
          { x: endX, y: endY },
          true,
          false,
          updatedPlayerCards
          // () => {
          // setGameData({
          //   ...gameData,
          //   players: {
          //     ...gameData.players,
          //     [playerID]: updatedPlayerCards,
          //   },
          // });
          // }
        );
      }
    }
  }, [dataFromBackend, moveCard, gameData, setGameData, suit, ownerID, value]);
}

export default useCardDrawFromSqueakDeck;
