import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { socket } from "../pages";
import { type ICardDropProposal } from "../pages/api/socket";

interface ICardDropAccepted extends Partial<ICardDropProposal> {
  squeakEndCoords?: {
    offsetHeight: number;
  };
  endID: string; // have this here or on main interface?
}

interface IUseCardDropApproved {
  value?: string;
  suit?: string;
  ownerID?: string;
  userID: string | null;
  rotation: number;
  moveCard: (
    { x, y }: { x: number; y: number },
    flip: boolean,
    rotate: boolean,
    callbackFunction?: () => void
  ) => void;
}

function useCardDropApproved({
  value,
  suit,
  ownerID,
  userID,
  rotation,
  moveCard,
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

      // making sure card + playerID match up to this <Card />
      if (
        card &&
        card.value === value &&
        card.suit === suit &&
        playerID === ownerID
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

          // offsets to account for rotation of card + padding on cell
          // honestly not too sure why rotation of 180 has a different offset
          // entirely from rotation of 0, but this mostly does the trick.
          if (endID.includes("cell")) {
            if (rotation === 0) {
              endX += 2;
              endY += 9;
            } else if (rotation === 90) {
              endX -= 8;
              endY += 14;
            } else if (rotation === 180) {
              endX += 3;
            } else if (rotation === 270) {
              endX -= 8;
              endY += 14;
            }
          }

          moveCard(
            { x: endX, y: endY },
            false,
            endID.includes("cell"),

            () => {
              if (playerID && updatedPlayerCards) {
                setGameData({
                  ...gameData,
                  board: updatedBoard!,
                  players: updatedPlayerCards,
                });
              }

              if (playerID === userID) {
                setProposedCardBoxShadow(null);
              }
            }
          );

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
    setGameData,
    setSoundPlayStates,
    setProposedCardBoxShadow,
    suit,
    ownerID,
    value,
    rotation,
    userID,
  ]);
}

export default useCardDropApproved;
