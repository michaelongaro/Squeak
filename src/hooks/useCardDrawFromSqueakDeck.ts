import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IDrawFromSqueakDeck } from "../pages/api/socket";

interface IUseCardDrawFromSqueakDeck {
  value?: string;
  suit?: string;
  ownerID?: string;
  moveCard: ({ x, y }: { x: number; y: number }, flip: boolean) => void;
}

function useCardDrawFromSqueakDeck({
  value,
  suit,
  ownerID,
  moveCard,
}: IUseCardDrawFromSqueakDeck) {
  const roomCtx = useRoomContext();

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
      setDataFromBackend(null); // if this doesn't work then move it to the end of the function

      console.log("executing useEffect in useCardDrawFromSqueakDeck");

      const {
        playerID,
        indexToDrawTo,
        updatedBoard,
        newCard,
        updatedPlayerCards,
      } = dataFromBackend;

      if (
        playerID !== ownerID ||
        newCard?.suit !== suit ||
        newCard?.value !== value
      )
        return;

      const endID = `${playerID}squeakHand${indexToDrawTo}`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      // console.log(
      //   "endID: ",
      //   endID,
      //   playerID,
      //   ownerID,
      //   newCard?.suit,
      //   suit,
      //   newCard?.value,
      //   value
      // );

      if (endLocation) {
        const endX = endLocation.x;
        const endY = endLocation.y;

        moveCard({ x: endX, y: endY }, true);

        setTimeout(() => {
          // console.log("setting game data nyow");

          roomCtx.setGameData({
            ...roomCtx.gameData,
            board: updatedBoard || roomCtx.gameData?.board,
            players: updatedPlayerCards || roomCtx.gameData?.players,
          });

          // setCardHasBeenPlaced(true);
        }, 250);
      }
    }
  }, [dataFromBackend, moveCard, roomCtx, suit, ownerID, value]);
}

export default useCardDrawFromSqueakDeck;
