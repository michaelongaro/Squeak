import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type IDrawFromDeck } from "../pages/api/socket";

interface IUseCardDrawFromDeck {
  value?: string;
  suit?: string;
  userID: string | null;
  moveCard: ({ x, y }: { x: number; y: number }, flip: boolean) => void;
}

function useCardDrawFromDeck({
  value,
  suit,
  userID,
  moveCard,
}: IUseCardDrawFromDeck) {
  const roomCtx = useRoomContext();

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

      console.log(
        "executing useEffect in useCardDrawFromDeck",
        playerID,
        userID,
        currentTopCardInDeck?.suit,
        currentTopCardInDeck?.value,
        suit,
        value,
        playerID === userID && currentTopCardInDeck === null,
        playerID !== userID ||
          currentTopCardInDeck?.value !== value ||
          currentTopCardInDeck?.suit !== suit
      );

      // I think this logic checks out
      if (playerID === userID && currentTopCardInDeck === null) {
        console.log("next top card in deck was null");

        roomCtx.setGameData({
          ...roomCtx.gameData,
          board: updatedBoard || roomCtx.gameData?.board,
          players: updatedPlayerCards || roomCtx.gameData?.players,
        });
        return;
      }

      if (
        playerID !== userID ||
        currentTopCardInDeck?.value !== value ||
        currentTopCardInDeck?.suit !== suit
      )
        return;

      const endID = `${playerID}hand`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      console.log("endLocation", endLocation);

      if (endLocation) {
        const endX = endLocation.x;
        const endY = endLocation.y;

        console.log(
          "successfully getting card ",
          value,
          suit,
          " to ",
          endX,
          endY
        );

        moveCard({ x: endX, y: endY }, true);

        setTimeout(() => {
          roomCtx.setGameData({
            ...roomCtx.gameData,
            board: updatedBoard || roomCtx.gameData?.board,
            players: updatedPlayerCards || roomCtx.gameData?.players,
          });

          // setCardHasBeenPlaced(true); // maybe need to uncomment this
        }, 250);
      }
    }
  }, [dataFromBackend, moveCard, roomCtx, suit, userID, value]);
}

export default useCardDrawFromDeck;
