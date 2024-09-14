import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type ICardDropProposal } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";

// is there any better approach than a partial here? don't like having to do huge
// guard clause at the start if it's not necessary
interface ICardDropAccepted extends Partial<ICardDropProposal> {
  startingCardMetadata: {
    originSqueakStackIdx?: number; // if undefined -> origin is hand
    destinationSqueakStackIdx?: number; // if undefined -> destination is board
    lengthOfStartStack: number; // will just be 1 for a single card
    lengthOfTargetStack: number;
    indexWithinStartStack: number;
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
  moveCard: ({
    newPosition,
    flip,
    rotate,
    callbackFunction,
  }: IMoveCard) => void;
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
    audioContext,
    masterVolumeGainNode,
    successfulMoveBuffer,
    otherPlayerCardMoveBuffer,
    setGameData,
    setProposedCardBoxShadow,
    squeakStackDragAlterations,
    setSqueakStackDragAlterations,
    viewportLabel,
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
        cardsInInitialPile,
        cardsInTargetPile,
        startingCardMetadata,
        endID,
        squeakEndCoords,
        gameData,
        playerID,
      } = dataFromBackend;

      // making sure card + playerID match up to this <Card />
      if (
        !card ||
        !ownerID ||
        !playerID ||
        gameData === undefined ||
        card.value !== value ||
        card.suit !== suit ||
        playerID !== ownerID ||
        cardsInInitialPile === undefined ||
        cardsInTargetPile === undefined
      )
        return;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();
      if (!endLocation) return;

      if (audioContext && masterVolumeGainNode && endID.includes("cell")) {
        const source = audioContext.createBufferSource();
        source.buffer =
          userID === ownerID ? successfulMoveBuffer : otherPlayerCardMoveBuffer;

        if (userID !== ownerID) {
          // randomize pitch just for variety's sake
          source.detune.value = Math.random() * 400 - 200;
        }

        source.connect(masterVolumeGainNode);
        source.start();
      }

      // fyi: hand -> cell = no need to setSqueakStackDragAlterations();

      // ---------- hand to squeak stack ----------
      if (
        startingCardMetadata.originSqueakStackIdx === undefined &&
        startingCardMetadata.destinationSqueakStackIdx !== undefined
      ) {
        const depthAlterations = [0, 0, 0, 0];
        depthAlterations[startingCardMetadata.destinationSqueakStackIdx] = 1;

        setSqueakStackDragAlterations({
          ...squeakStackDragAlterations,
          [ownerID]: {
            squeakStackDepthAlterations: depthAlterations,
          },
        });
      }

      // ---------- squeak stack to squeak stack ----------
      else if (
        startingCardMetadata.originSqueakStackIdx !== undefined &&
        startingCardMetadata.destinationSqueakStackIdx !== undefined
      ) {
        const depthAlterations = [0, 0, 0, 0];
        depthAlterations[startingCardMetadata.originSqueakStackIdx] =
          -startingCardMetadata.lengthOfStartStack;
        depthAlterations[startingCardMetadata.destinationSqueakStackIdx] =
          startingCardMetadata.lengthOfStartStack;

        setSqueakStackDragAlterations({
          ...squeakStackDragAlterations,
          [ownerID]: {
            squeakStackDepthAlterations: depthAlterations,
            draggedStack: {
              length: startingCardMetadata.lengthOfStartStack,
              lengthOfTargetStack: startingCardMetadata.lengthOfTargetStack,
              squeakStackIdx: startingCardMetadata.originSqueakStackIdx,
              indexWithinStartStack: startingCardMetadata.indexWithinStartStack,
            },
          },
        });
      }

      // ---------- squeak stack to board ----------
      else if (
        startingCardMetadata.originSqueakStackIdx !== undefined &&
        startingCardMetadata.destinationSqueakStackIdx === undefined
      ) {
        const depthAlterations = [0, 0, 0, 0];
        depthAlterations[startingCardMetadata.originSqueakStackIdx] = -1;

        setSqueakStackDragAlterations({
          ...squeakStackDragAlterations,
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

      // offsets to account for rotation being around the center of the card
      // (I couldn't figure out how to natively solve this with transform-origin tricks)
      const scaledOffset = getScaledOffset(viewportLabel);

      if (endID.includes("cell")) {
        if (rotation === 90) {
          endX -= scaledOffset;
          endY += scaledOffset;
        } else if (rotation === 270) {
          endX -= scaledOffset;
          endY += scaledOffset;
        }
      }

      // pseudo depth doesn't apply to the first card a the pile
      const adjustedCardsInTargetPile =
        cardsInTargetPile === 1 ? 0 : cardsInTargetPile;
      const adjustedCardsInInitialPile =
        cardsInInitialPile === 1 ? 0 : cardsInInitialPile;

      moveCard({
        newPosition: { x: endX, y: endY },
        pseudoVerticalDepthDifferential:
          (adjustedCardsInTargetPile - adjustedCardsInInitialPile) * 0.15,
        flip: false,
        rotate: endID.includes("cell"),
        callbackFunction: () => {
          setSqueakStackDragAlterations({
            ...squeakStackDragAlterations,
            [ownerID]: {
              squeakStackDepthAlterations: [0, 0, 0, 0],
              draggedStack: undefined,
            },
          });

          setGameData(gameData);

          if (playerID === userID) {
            setProposedCardBoxShadow(null);
          }
        },
      });

      if (endID.includes("cell") && playerID === userID) {
        setProposedCardBoxShadow({
          id: endID,
          boxShadowValue: `0px 0px 4px 3px hsl(120, 100%, 86%)`,
        });
      }
    }
  }, [
    dataFromBackend,
    moveCard,
    setGameData,
    audioContext,
    masterVolumeGainNode,
    successfulMoveBuffer,
    otherPlayerCardMoveBuffer,
    setProposedCardBoxShadow,
    squeakStackDragAlterations,
    setSqueakStackDragAlterations,
    suit,
    ownerID,
    value,
    rotation,
    userID,
    viewportLabel,
  ]);
}

export default useCardDropApproved;

function getScaledOffset(
  viewportLabel: "mobile" | "mobileLarge" | "tablet" | "desktop",
) {
  switch (viewportLabel) {
    case "mobile":
      return 7.46;
    case "mobileLarge":
      return 8.05;
    case "tablet":
      return 8.51;
    case "desktop":
    default:
      return 10;
  }
}
