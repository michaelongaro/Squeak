import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type ICardDropProposal } from "../pages/api/socket";
import { type ICard } from "../utils/generateDeckAndSqueakCards";

interface ICardDropAccepted extends Partial<ICardDropProposal> {
  squeakEndCoords?: {
    // squeakStack: ICard[];
    offsetHeight: number;
    stackOfCardsMoved?: ICard[];
    // col: number;
    // row: number;
  };
  endID: string; // have this here or on main interface?
}

interface IUseCardDropApproved {
  value?: string;
  suit?: string;
  ownerID?: string;
  userID: string | null;
  origin?: "deck" | "squeak";
  moveCard: (
    { x, y }: { x: number; y: number },
    flip: boolean,
    rotate: boolean,
    callbackFunction?: () => void
  ) => void;
  setCardOffsetPosition: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
    }>
  >;
  setCardHasBeenPlaced: React.Dispatch<React.SetStateAction<boolean>>;
}

function useCardDropApproved({
  value,
  suit,
  ownerID,
  userID,
  origin,
  moveCard,
  setCardOffsetPosition,
  setCardHasBeenPlaced,
}: IUseCardDropApproved) {
  const {
    gameData,
    setGameData,
    setProposedCardBoxShadow,
    setSoundPlayStates,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<ICardDropAccepted | null>(null);

  useEffect(() => {
    socket.on("cardDropApproved", (data) => setDataFromBackend(data));

    return () => {
      socket.off("cardDropApproved", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const {
        card,
        endID,
        squeakEndCoords,
        updatedBoard,
        updatedPlayerCards,
        playerID,
      } = dataFromBackend;

      // check to see if current card is a child of the card that was dropped
      let childOfCardThatWasDropped = false;
      if (
        // squeakEndCoords implies that it was a squeak -> squeak move
        squeakEndCoords &&
        value &&
        suit
      ) {
        if (
          squeakEndCoords.stackOfCardsMoved?.some(
            (card) => card.value === value && card.suit === suit
          )
        ) {
          childOfCardThatWasDropped = true;
        }
      }

      // making sure card + playerID match up to this <Card />
      if (
        (card &&
          card.value === value &&
          card.suit === suit &&
          playerID === ownerID) ||
        (childOfCardThatWasDropped && playerID === ownerID)
      ) {
        const endLocation = document
          .getElementById(endID)
          ?.getBoundingClientRect();
        if (endLocation) {
          const endX = endLocation.x;
          const endY = squeakEndCoords
            ? endLocation.y + squeakEndCoords.offsetHeight
            : endLocation.y;

          moveCard({ x: endX, y: endY }, false, endID.includes("cell"), () => {
            setGameData({
              ...gameData,
              board: updatedBoard || gameData?.board,
              players: updatedPlayerCards || gameData?.players,
            });

            if (playerID === userID) {
              setProposedCardBoxShadow(null);
            }

            if (ownerID !== userID && origin === "deck") {
              setCardOffsetPosition({ x: 0, y: 0 });
            } else {
              setCardHasBeenPlaced(true);
            }
          });

          if (playerID === userID) {
            if (endID.includes("cell")) {
              setSoundPlayStates((prevState) => ({
                ...prevState,
                currentPlayer: true,
              }));
            }

            setProposedCardBoxShadow({
              id: endID,
              boxShadowValue: `0px 0px 4px 3px rgba(29, 232, 7, 1)`,
            });
          } else if (playerID && endID.includes("cell")) {
            setSoundPlayStates((prevState) => ({
              ...prevState,
              otherPlayers: {
                ...prevState.otherPlayers,
                [playerID]: true,
              },
            }));
          }
        }
      }
    }
  }, [
    dataFromBackend,
    moveCard,
    gameData,
    setSoundPlayStates,
    setGameData,
    setProposedCardBoxShadow,
    suit,
    ownerID,
    value,
    origin,
    setCardHasBeenPlaced,
    setCardOffsetPosition,
    userID,
  ]);
}

export default useCardDropApproved;
