import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type ICardDropProposal } from "../pages/api/socket";
import { type ICard } from "../utils/generateDeckAndSqueakCards";

interface ICardDropAccepted extends Partial<ICardDropProposal> {
  squeakEndCoords?: {
    offsetHeight: number;
    stackOfCardsMoved?: ICard[];
  };
  endID: string; // have this here or on main interface?
}

interface IUseCardDropApproved {
  value?: string;
  suit?: string;
  ownerID?: string;
  userID: string | null;
  rotation: number;
  origin?: "deck" | "hand" | "squeak";
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
  rotation,
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
          let endX = endLocation.x;
          let endY = endLocation.y;

          if (squeakEndCoords?.offsetHeight) {
            if (rotation === 0) {
              endY += squeakEndCoords.offsetHeight;
            } else if (rotation === 90) {
              endX -= squeakEndCoords.offsetHeight;
            } else if (rotation === 180) {
              endY -= squeakEndCoords.offsetHeight;
            } else if (rotation === 270) {
              endX += squeakEndCoords.offsetHeight;
            }
          }

          moveCard({ x: endX, y: endY }, false, endID.includes("cell"), () => {
            setGameData({
              ...gameData,
              board: updatedBoard || gameData?.board,
              players: updatedPlayerCards || gameData?.players,
            });

            if (playerID === userID) {
              setProposedCardBoxShadow(null);
            }

            if (ownerID !== userID && origin === "hand") {
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
    rotation,
    setCardHasBeenPlaced,
    setCardOffsetPosition,
    userID,
  ]);
}

export default useCardDropApproved;
