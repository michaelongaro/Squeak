import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import {
  IRoomPlayersMetadata,
  type ICardDropProposal,
} from "../pages/api/socket";
import { type IMoveCard } from "../components/Play/Card";
import { useMainStore } from "~/stores/MainStore";
import useGetUserID from "~/hooks/useGetUserID";

// is there any better approach than a partial here? don't like having to do huge
// guard clause at the start if it's not necessary
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

function useCardDropApproved() {
  const userID = useGetUserID();

  const {
    audioContext,
    masterVolumeGainNode,
    successfulMoveBuffer,
    otherPlayerCardMoveBuffer,
    setGameData,
    queuedCardMoves,
    setQueuedCardMoves,
    playerMetadata,
    setProposedCardBoxShadow,
    squeakStackDragAlterations,
    setOtherPlayerSqueakStacksBeingDragged,
    smallerViewportCardBeingMoved,
    setSmallerViewportCardBeingMoved,
  } = useMainStore((state) => ({
    audioContext: state.audioContext,
    masterVolumeGainNode: state.masterVolumeGainNode,
    successfulMoveBuffer: state.successfulMoveBuffer,
    otherPlayerCardMoveBuffer: state.otherPlayerCardMoveBuffer,
    setGameData: state.setGameData,
    queuedCardMoves: state.queuedCardMoves,
    setQueuedCardMoves: state.setQueuedCardMoves,
    playerMetadata: state.playerMetadata,
    setProposedCardBoxShadow: state.setProposedCardBoxShadow,
    squeakStackDragAlterations: state.squeakStackDragAlterations,
    setOtherPlayerSqueakStacksBeingDragged:
      state.setOtherPlayerSqueakStacksBeingDragged,
    smallerViewportCardBeingMoved: state.smallerViewportCardBeingMoved,
    setSmallerViewportCardBeingMoved: state.setSmallerViewportCardBeingMoved,
  }));

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
        boardEndLocation,
        gameData,
        playerID,
      } = dataFromBackend;

      // making sure card + playerID match up to this <Card />
      if (
        !card ||
        // !ownerID ||
        !playerID ||
        gameData === undefined
        // card.value !== value ||
        // card.suit !== suit ||
        // playerID !== ownerID
      )
        return;

      // setting ctx state for smaller viewports to know which card
      // should be made visible during it's programmatic move that's about to happen

      if (userID !== playerID && endID.includes("cell")) {
        setSmallerViewportCardBeingMoved({
          ...smallerViewportCardBeingMoved,
          [playerID]: `${card.suit}${card.value}`,
        });
      }

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();
      if (!endLocation) return;

      if (audioContext && masterVolumeGainNode && endID.includes("cell")) {
        const source = audioContext.createBufferSource();
        source.buffer =
          userID === playerID
            ? successfulMoveBuffer
            : otherPlayerCardMoveBuffer;

        if (userID !== playerID) {
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
          [playerID]: {
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
          [playerID]: {
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
          [playerID]: {
            squeakStackDepthAlterations: depthAlterations,
          },
        });
      }

      let endX = endLocation.x;
      let endY = endLocation.y;

      const rotation = getPlayerRotation(playerMetadata, playerID);

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

      const cardID = `${playerID}${card.value}${card.suit}`;

      // queue card to be moved
      const newQueuedCardMoves = { ...queuedCardMoves };

      newQueuedCardMoves[cardID] = {
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
            [playerID]: {
              squeakStackDepthAlterations: [0, 0, 0, 0],
              draggedStack: undefined,
            },
          });

          if (playerID) {
            setGameData(gameData);
          }

          if (playerID === userID) {
            setProposedCardBoxShadow(null);
          }
        },
      };

      setQueuedCardMoves(newQueuedCardMoves);

      // moveCard({
      //   newPosition: { x: endX, y: endY },
      //   flip: false,
      //   rotate: endID.includes("cell"),
      //   callbackFunction: () => {
      //     if (endID.includes("cell")) {
      //       setSmallerViewportCardBeingMoved({
      //         ...smallerViewportCardBeingMoved,
      //         [playerID]: null,
      //       });
      //     }

      //     setOtherPlayerSqueakStacksBeingDragged({
      //       ...squeakStackDragAlterations,
      //       [ownerID]: {
      //         squeakStackDepthAlterations: [0, 0, 0, 0],
      //         draggedStack: undefined,
      //       },
      //     });

      //     if (playerID) {
      //       const prevGameData = useMainStore.getState().gameData;

      //       const newBoard = structuredClone(prevGameData.board);

      //       if (boardEndLocation) {
      //         const { row, col } = boardEndLocation;
      //         newBoard[row]![col] = card;
      //       }

      //       const newGameData = {
      //         ...prevGameData,
      //         board: newBoard,
      //         players: {
      //           ...prevGameData.players,
      //           [playerID]: updatedPlayerCards,
      //         },
      //       };

      //       setGameData(newGameData);

      //       // remove card from queued cards
      //       const prevQueuedCards = useMainStore.getState().queuedCards;

      //       const newQueuedCards = { ...prevQueuedCards };
      //       delete newQueuedCards[`${ownerID}-${value}${suit}`];
      //       setQueuedCards(newQueuedCards);
      //     }

      //     if (playerID === userID) {
      //       setProposedCardBoxShadow(null);
      //     }
      //   },
      // });

      if (playerID === userID) {
        setProposedCardBoxShadow({
          id: endID,
          boxShadowValue: `0px 0px 4px 3px hsl(120, 100%, 86%)`,
        });
      }
    }
  }, [
    dataFromBackend,
    setGameData,
    audioContext,
    masterVolumeGainNode,
    successfulMoveBuffer,
    otherPlayerCardMoveBuffer,
    setProposedCardBoxShadow,
    squeakStackDragAlterations,
    setOtherPlayerSqueakStacksBeingDragged,
    userID,
    smallerViewportCardBeingMoved,
    setSmallerViewportCardBeingMoved,
    queuedCardMoves,
    setQueuedCardMoves,
    playerMetadata,
  ]);
}

export default useCardDropApproved;

function getPlayerRotation(
  playerMetadata: IRoomPlayersMetadata,
  playerID: string,
): number {
  const playerIDs = Object.keys(playerMetadata);

  const rotationByIdx = {
    0: 0,
    1: 180,
    2: 90,
    3: 270,
  };

  const playerIdx = playerIDs.indexOf(playerID);

  return rotationByIdx[playerIdx as 0 | 1 | 2 | 3];
}
