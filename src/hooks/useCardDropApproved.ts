import { useState, useEffect } from "react";
import { socket } from "../pages";
import { useRoomContext } from "../context/RoomContext";
import { type ICardDropProposal } from "../pages/api/socket";

interface ICardDropAccepted extends Partial<ICardDropProposal> {
  startingCardMetadata: {
    originSqueakStackIdx?: number; // if undefined -> origin is hand
    destinationSqueakStackIdx?: number; // if undefined -> destination is board
    lengthOfStack: number; // will just be 1 for a single card
  };
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
    setGameData,
    setProposedCardBoxShadow,
    soundPlayStates,
    setSoundPlayStates,
    otherPlayerSqueakStacksBeingDragged,
    setOtherPlayerSqueakStacksBeingDragged,
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
        startingCardMetadata,
        endID,
        squeakEndCoords,
        updatedGameData,
        playerID,
      } = dataFromBackend;

      // making sure card + playerID match up to this <Card />
      if (
        !card ||
        !ownerID ||
        card.value !== value ||
        card.suit !== suit ||
        playerID !== ownerID
      )
        return;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();
      if (!endLocation) return;

      // fyi: hand -> cell = no need to setOtherPlayerSqueakStacksBeingDragged();

      // ---------- hand to squeak stack ----------
      if (
        !startingCardMetadata?.originSqueakStackIdx &&
        startingCardMetadata?.destinationSqueakStackIdx !== undefined
      ) {
        const depthAlterations = [0, 0, 0, 0];
        depthAlterations[startingCardMetadata.destinationSqueakStackIdx] = 1;
        setOtherPlayerSqueakStacksBeingDragged({
          ...otherPlayerSqueakStacksBeingDragged,
          [ownerID]: {
            squeakStackDepthAlterations: depthAlterations,
          },
        });
      }

      // ---------- squeak stack to squeak stack ----------
      else if (
        startingCardMetadata?.originSqueakStackIdx !== undefined &&
        startingCardMetadata?.destinationSqueakStackIdx !== undefined
      ) {
        const depthAlterations = [0, 0, 0, 0];
        depthAlterations[startingCardMetadata.originSqueakStackIdx] =
          -startingCardMetadata.lengthOfStack;
        depthAlterations[startingCardMetadata.destinationSqueakStackIdx] =
          startingCardMetadata.lengthOfStack;
        setOtherPlayerSqueakStacksBeingDragged({
          ...otherPlayerSqueakStacksBeingDragged,
          [ownerID]: {
            squeakStackDepthAlterations: depthAlterations,
          },
        });
      }

      // ---------- squeak stack to board ----------
      else if (
        startingCardMetadata?.originSqueakStackIdx !== undefined &&
        !startingCardMetadata?.destinationSqueakStackIdx
      ) {
        const depthAlterations = [0, 0, 0, 0];
        depthAlterations[startingCardMetadata.originSqueakStackIdx] =
          -startingCardMetadata.lengthOfStack;
        setOtherPlayerSqueakStacksBeingDragged({
          ...otherPlayerSqueakStacksBeingDragged,
          [ownerID]: {
            squeakStackDepthAlterations: depthAlterations,
          },
        });
      }

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
          setOtherPlayerSqueakStacksBeingDragged({
            ...otherPlayerSqueakStacksBeingDragged,
            [ownerID]: {
              squeakStackDepthAlterations: [0, 0, 0, 0],
              draggedStack: undefined,
            },
          });

          if (playerID && updatedGameData) {
            setGameData(updatedGameData);
          }

          if (playerID === userID) {
            setProposedCardBoxShadow(null);
          }
        }
      );

      if (playerID === userID) {
        if (endID.includes("cell")) {
          setSoundPlayStates({
            ...soundPlayStates,
            currentPlayer: true,
          });
        }

        setProposedCardBoxShadow({
          id: endID,
          boxShadowValue: `0px 0px 4px 3px rgba(29, 232, 7, 1)`,
        });
      } else if (playerID && endID.includes("cell")) {
        setSoundPlayStates({
          ...soundPlayStates,
          otherPlayers: {
            ...soundPlayStates.otherPlayers,
            [playerID]: true,
          },
        });
      }
    }
  }, [
    dataFromBackend,
    moveCard,
    setGameData,
    soundPlayStates,
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
