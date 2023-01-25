import { IPlayerMetadata } from "./../components/CreateRoom/CreateRoom";
import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import {
  IPlayerCardsMetadata,
  type IDrawFromSqueakDeck,
} from "../pages/api/socket";

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
      setDataFromBackend(null);

      const {
        playerID,
        indexToDrawTo,
        newCard,
        updatedBoard,
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

      if (endLocation) {
        const endX = endLocation.x;
        const endY = endLocation.y;

        moveCard({ x: endX, y: endY }, true);

        setTimeout(() => {
          roomCtx.setGameData({
            ...roomCtx.gameData,
            board: updatedBoard || roomCtx.gameData?.board,
            players: updatedPlayerCards || roomCtx.gameData?.players,
          });
        }, 250);
      }
    }
  }, [dataFromBackend, moveCard, roomCtx, suit, ownerID, value]);
}

export default useCardDrawFromSqueakDeck;
