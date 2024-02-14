import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";
import { type ICardDropProposal } from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";

interface ICardDropAccepted extends Partial<ICardDropProposal> {
  startingCardMetadata: {
    originSqueakStackIdx?: number; // if undefined -> origin is hand
    destinationSqueakStackIdx?: number; // if undefined -> destination is board
    lengthOfStack: number; // will just be 1 for a single card
    lengthOfTargetStack: number;
    startingDepth: number;
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
    setOtherPlayerSqueakStacksBeingDragged,
    smallerViewportCardBeingMoved,
    setSmallerViewportCardBeingMoved,
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

      // setting ctx state for smaller viewports to know which card
      // should be made visible during it's programmatic move that's about to happen

      if (userID !== playerID && endID.includes("cell")) {
        setSmallerViewportCardBeingMoved({
          ...smallerViewportCardBeingMoved,
          [playerID]: `${suit}${value}`,
        });
      }

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

      // fyi: hand -> cell = no need to setOtherPlayerSqueakStacksBeingDragged();

      // ---------- hand to squeak stack ----------
      if (
        !startingCardMetadata?.originSqueakStackIdx &&
        startingCardMetadata?.destinationSqueakStackIdx !== undefined
      ) {
        const depthAlterations = [0, 0, 0, 0];
        depthAlterations[startingCardMetadata.destinationSqueakStackIdx] = 1;

        setOtherPlayerSqueakStacksBeingDragged({
          ...squeakStackDragAlterations,
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
          ...squeakStackDragAlterations,
          [ownerID]: {
            squeakStackDepthAlterations: depthAlterations,
            draggedStack: {
              length: startingCardMetadata.lengthOfStack,
              lengthOfTargetStack: startingCardMetadata.lengthOfTargetStack,
              squeakStackIdx: startingCardMetadata.originSqueakStackIdx,
              startingDepth: startingCardMetadata.startingDepth,
            },
          },
        });
      }

      // ---------- squeak stack to board ----------
      else if (
        startingCardMetadata?.originSqueakStackIdx !== undefined &&
        !startingCardMetadata?.destinationSqueakStackIdx
      ) {
        const depthAlterations = [0, 0, 0, 0];
        depthAlterations[startingCardMetadata.originSqueakStackIdx] = -1;

        setOtherPlayerSqueakStacksBeingDragged({
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
      // TODO: will have to change this dynamically if using smaller card sizes on smaller viewports
      if (endID.includes("cell")) {
        if (rotation === 90) {
          endX -= 10;
          endY += 10;
        } else if (rotation === 270) {
          endX -= 10;
          endY += 10;
        }
      }

      moveCard({
        newPosition: { x: endX, y: endY },
        flip: false,
        rotate: endID.includes("cell"),
        callbackFunction: () => {
          if (endID.includes("cell")) {
            setSmallerViewportCardBeingMoved({
              ...smallerViewportCardBeingMoved,
              [playerID]: null,
            });
          }

          setOtherPlayerSqueakStacksBeingDragged({
            ...squeakStackDragAlterations,
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
        },
      });

      if (playerID === userID) {
        setProposedCardBoxShadow({
          id: endID,
          boxShadowValue: `0px 0px 4px 3px rgba(29, 232, 7, 1)`,
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
    setOtherPlayerSqueakStacksBeingDragged,
    suit,
    ownerID,
    value,
    rotation,
    userID,
    smallerViewportCardBeingMoved,
    setSmallerViewportCardBeingMoved,
  ]);
}

export default useCardDropApproved;
