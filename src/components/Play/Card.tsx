import { useState, useRef, useCallback } from "react";
import React from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import cardPlacementIsValid from "../../utils/cardPlacementIsValid";
import useCardDrawFromDeck from "../../hooks/useCardDrawFromDeck";
import useCardDrawFromSqueakDeck from "../../hooks/useCardDrawFromSqueakDeck";
import useCardDropApproved from "../../hooks/useCardDropApproved";
import useCardDropDenied from "../../hooks/useCardDropDenied";
import { adjustCoordinatesByRotation } from "../../utils/adjustCoordinatesByRotation";
import { type StaticImageData } from "next/image";
import { cardAssets } from "../../utils/cardAssetPaths";
import useInitialCardDrawForSqueakStack from "~/hooks/useInitialCardDrawForSqueakStack";

interface ICardComponent {
  value?: string;
  suit?: string;
  showCardBack?: boolean;
  draggable: boolean;
  origin?: "deck" | "hand" | "squeakHand" | "squeakDeck";
  ownerID?: string;
  startID?: string;
  squeakStackLocation?: [number, number];
  rotation: number;
  hueRotation: number;
  width?: number;
  height?: number;
  manuallyShowSpecificCardFront?: "normal" | "simple";
}

export interface IMoveCard {
  newPosition: { x: number; y: number };
  flip: boolean;
  rotate: boolean;
  callbackFunction?: () => void;
}

function Card({
  value,
  suit,
  showCardBack,
  draggable,
  startID,
  origin,
  ownerID,
  rotation,
  squeakStackLocation,
  hueRotation,
  width,
  height,
  manuallyShowSpecificCardFront,
}: ICardComponent) {
  const userID = useUserIDContext();

  const {
    roomConfig,
    gameData,
    hoveredCell,
    holdingADeckCard,
    holdingASqueakCard,
    hoveredSqueakStack,
    originIndexForHeldSqueakCard,
    heldSqueakStackLocation,
    audioContext,
    masterVolumeGainNode,
    notAllowedMoveBuffer,
    setProposedCardBoxShadow,
    setHeldSqueakStackLocation,
    cardBeingMovedProgramatically,
    setCardBeingMovedProgramatically,
    squeakDeckBeingMovedProgramatically,
    setSqueakDeckBeingMovedProgramatically,
    prefersSimpleCardAssets,
    setHoldingADeckCard,
    setHoldingASqueakCard,
  } = useRoomContext();

  const [cardOffsetPosition, setCardOffsetPosition] = useState({ x: 0, y: 0 });
  const [forceShowCardFront, setForceShowCardFront] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const inMovingSqueakStack =
    (squeakStackLocation &&
      heldSqueakStackLocation &&
      ownerID &&
      heldSqueakStackLocation[ownerID] &&
      heldSqueakStackLocation[ownerID]!.squeakStack[0] ===
        squeakStackLocation[0] &&
      heldSqueakStackLocation[ownerID]!.squeakStack[1] <
        squeakStackLocation[1]) ??
    false;

  const moveCard = useCallback(
    ({ newPosition, flip, rotate, callbackFunction }: IMoveCard) => {
      if (!cardRef.current || !imageRef.current) return;

      let start: number | undefined;
      let done = false;

      function animationEndHandler() {
        if (!cardRef.current || !imageRef.current) return;

        cardRef.current.style.transition = "none";
        cardRef.current.style.zIndex = "100";
        cardRef.current.style.willChange = "auto";

        imageRef.current.style.zIndex = "100";
        imageRef.current.style.willChange = "auto";

        if ((origin === "hand" || origin === "squeakHand") && ownerID) {
          setCardBeingMovedProgramatically({
            ...cardBeingMovedProgramatically,
            [ownerID]: false,
          });
        }

        if (origin === "squeakDeck" && ownerID) {
          setSqueakDeckBeingMovedProgramatically({
            ...squeakDeckBeingMovedProgramatically,
            [ownerID]: false,
          });
        }

        callbackFunction?.();

        if (origin === "deck") {
          setCardOffsetPosition({
            x: 0,
            y: 0,
          });
        }

        if (squeakStackLocation && ownerID) {
          setHeldSqueakStackLocation({
            ...heldSqueakStackLocation,
            [ownerID]: null,
          });
        }
      }

      if ((origin === "hand" || origin === "squeakHand") && ownerID) {
        setCardBeingMovedProgramatically({
          ...cardBeingMovedProgramatically,
          [ownerID]: true,
        });
      }

      if (origin === "squeakDeck" && ownerID) {
        setSqueakDeckBeingMovedProgramatically({
          ...squeakDeckBeingMovedProgramatically,
          [ownerID]: true,
        });
      }

      cardRef.current.style.willChange = "transform";
      imageRef.current.style.willChange = "transform, filter";

      cardRef.current.style.transition = "all 325ms ease-out, filter 163ms";
      imageRef.current.style.transition = "transform 163ms ease-out";
      imageRef.current.style.transform = "scale(1)";

      const currentImageTransform = imageRef.current.style.transform;

      if (origin === "hand" && ownerID === userID) {
        setHoldingADeckCard(false);
      } else if (origin === "squeakDeck" && ownerID === userID) {
        setHoldingASqueakCard(false);
      }

      if (newPosition.x === 0 && newPosition.y === 0) {
        if (hoveredCell) {
          setProposedCardBoxShadow({
            id: `cell${hoveredCell[0]}${hoveredCell[1]}`,
            boxShadowValue: `0px 0px 4px 3px rgba(227, 12, 5, 1)`,
          });

          setTimeout(() => {
            setProposedCardBoxShadow(null);
          }, 250);
        } else if (
          hoveredSqueakStack !== null &&
          originIndexForHeldSqueakCard !== hoveredSqueakStack
        ) {
          setProposedCardBoxShadow({
            id: `${userID}squeakHand${hoveredSqueakStack}`,
            boxShadowValue: `0px 0px 4px 3px rgba(227, 12, 5, 1)`,
          });

          setTimeout(() => {
            setProposedCardBoxShadow(null);
          }, 250);
        }

        setCardOffsetPosition({ x: 0, y: 0 });

        if (squeakStackLocation && ownerID) {
          setHeldSqueakStackLocation({
            ...heldSqueakStackLocation,
            [ownerID]: {
              squeakStack: squeakStackLocation,
              location: { x: 0, y: 0 },
            },
          });
        }
      } else if (startID) {
        const currentCard = document.getElementById(startID);

        if (!currentCard) return;

        const { x: currentX, y: currentY } =
          currentCard.getBoundingClientRect();

        const { x: endXCoordinate, y: endYCoordinate } =
          adjustCoordinatesByRotation(
            Math.floor(newPosition.x - currentX),
            Math.floor(newPosition.y - currentY),
            rotation,
          );

        setCardOffsetPosition({
          x: endXCoordinate,
          y: endYCoordinate,
        });

        if (squeakStackLocation && ownerID) {
          setHeldSqueakStackLocation({
            ...heldSqueakStackLocation,
            [ownerID]: {
              squeakStack: squeakStackLocation,
              location: { x: endXCoordinate, y: endYCoordinate },
            },
          });
        }

        // cards are symmetrical across y-axis so need to rotate when card is already
        // in correct orientation relative to how it will look on the board.
        // Rotating minimum amount to get back to 0deg total rotation, also currently
        // keeping 180 in there for card front assets that are not symmetrical.
        if (rotate) {
          let rotationAngle = 0;

          if (rotation === 90) rotationAngle = -90;
          else if (rotation === 180) rotationAngle = -180;
          else if (rotation === 270) rotationAngle = 90;

          imageRef.current.style.transform =
            currentImageTransform + ` rotateZ(${rotationAngle}deg)`;
        }
      }

      if (flip) {
        if (!cardRef.current) return;

        imageRef.current.style.transform =
          currentImageTransform + " rotateY(90deg)";

        setTimeout(() => {
          if (!imageRef.current) return;

          setForceShowCardFront(true);

          imageRef.current.style.transform = currentImageTransform.replace(
            "rotateY(90deg)",
            "rotateY(0deg)",
          );
        }, 163);
      }

      function step(timestamp: number) {
        if (start === undefined) {
          start = timestamp;
        }
        const elapsed = timestamp - start;

        // 325ms is the duration of the card movement animation
        // TODO: we had a +25ms "buffer" on this value before, but I really don't
        // know if it was helping at all
        if (elapsed <= 325) {
          if (!done) {
            window.requestAnimationFrame(step);
          }
        } else {
          animationEndHandler();
          done = true;
        }
      }

      window.requestAnimationFrame(step);
    },
    [
      origin,
      squeakStackLocation,
      rotation,
      startID,
      userID,
      hoveredCell,
      ownerID,
      hoveredSqueakStack,
      originIndexForHeldSqueakCard,
      setHeldSqueakStackLocation,
      setHoldingADeckCard,
      setHoldingASqueakCard,
      setProposedCardBoxShadow,
      cardBeingMovedProgramatically,
      setCardBeingMovedProgramatically,
      heldSqueakStackLocation,
      squeakDeckBeingMovedProgramatically,
      setSqueakDeckBeingMovedProgramatically,
    ],
  );

  // hooks to handle socket emits from server
  useCardDrawFromDeck({
    value,
    suit,
    ownerID,
    rotation,
    moveCard,
  });

  useCardDrawFromSqueakDeck({
    value,
    suit,
    ownerID,
    moveCard,
  });

  useInitialCardDrawForSqueakStack({
    value,
    suit,
    ownerID,
    moveCard,
  });

  useCardDropApproved({
    value,
    suit,
    userID,
    ownerID,
    rotation,
    moveCard,
  });

  useCardDropDenied({
    value,
    suit,
    ownerID,
    moveCard,
  });

  function moveCardBackToOriginWithSound(originSqueakStackIndex?: number) {
    moveCard({
      newPosition: { x: 0, y: 0 },
      flip: false,
      rotate: false,
    });

    if (!audioContext || !masterVolumeGainNode) return;

    // dropping squeak stack card back on original stack is allowed, therefore
    // don't play the not allowed sound
    if (hoveredSqueakStack !== originSqueakStackIndex) {
      const source = audioContext.createBufferSource();
      source.buffer = notAllowedMoveBuffer;
      source.detune.value = -650;

      source.connect(masterVolumeGainNode);
      source.start();
    }
  }

  function dropHandler() {
    // deck start + board end
    if (holdingADeckCard && hoveredCell && value && suit) {
      const [row, col] = hoveredCell;

      const boardCell = gameData?.board?.[row]?.[col] || null;

      if (cardPlacementIsValid(boardCell, value, suit, true)) {
        socket.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          deckStart: true,
          boardEndLocation: { row, col },
          playerID: userID,
          roomCode: roomConfig.code,
        });
      } else {
        moveCardBackToOriginWithSound();
      }
    }

    // deck start + squeak end
    else if (holdingADeckCard && hoveredSqueakStack !== null && value && suit) {
      const idx = hoveredSqueakStack;

      const bottomSqueakStackCard =
        gameData.players?.[userID]?.squeakHand?.[idx]?.slice(-1)[0] || null;

      if (cardPlacementIsValid(bottomSqueakStackCard, value, suit, false)) {
        socket.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          deckStart: true,
          squeakEndLocation: idx,
          playerID: userID,
          roomCode: roomConfig.code,
        });
      } else {
        moveCardBackToOriginWithSound();
      }
    }

    // squeak start + board end
    else if (
      holdingASqueakCard &&
      hoveredCell &&
      originIndexForHeldSqueakCard !== null &&
      value &&
      suit
    ) {
      const [row, col] = hoveredCell;

      const boardCell = gameData?.board?.[row]?.[col] || null;

      // making sure that the card being moved is the bottom card in the stack
      // since it's not legal to move a card from the middle of a stack to the board
      if (
        squeakStackLocation &&
        squeakStackLocation[1] ===
          gameData.players[userID]!.squeakHand[squeakStackLocation[0]]!.length -
            1 &&
        cardPlacementIsValid(boardCell, value, suit, true)
      ) {
        socket.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          squeakStartLocation: originIndexForHeldSqueakCard,
          boardEndLocation: { row, col },
          playerID: userID,
          roomCode: roomConfig.code,
        });
      } else {
        moveCardBackToOriginWithSound();
      }
    }

    // squeak start + squeak end
    else if (
      holdingASqueakCard &&
      hoveredSqueakStack !== null &&
      originIndexForHeldSqueakCard !== null &&
      value &&
      suit
    ) {
      const idx = hoveredSqueakStack;

      const parentSqueakStackCard =
        gameData?.players?.[userID!]?.squeakHand?.[idx]?.slice(-1)[0] || null;

      if (cardPlacementIsValid(parentSqueakStackCard, value, suit, false)) {
        socket.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          squeakStartLocation: originIndexForHeldSqueakCard,
          squeakEndLocation: hoveredSqueakStack,
          playerID: userID,
          roomCode: roomConfig.code,
        });
      } else {
        moveCardBackToOriginWithSound(squeakStackLocation?.[0]);
      }
    }

    // dropping card over anywhere else on the screen
    else {
      moveCard({
        newPosition: { x: 0, y: 0 },
        flip: false,
        rotate: false,
      });
    }
  }

  function dragHandler(e: DraggableEvent, data: DraggableData) {
    setCardOffsetPosition({
      x: data.x,
      y: data.y,
    });

    if (squeakStackLocation && ownerID) {
      setHeldSqueakStackLocation({
        ...heldSqueakStackLocation,
        [ownerID!]: {
          squeakStack: squeakStackLocation,
          location: {
            x: data.x,
            y: data.y,
          },
        },
      });
    }
  }

  function getTransitionStyles() {
    let transitionStyles = "";

    if (
      inMovingSqueakStack &&
      (!holdingASqueakCard ||
        (heldSqueakStackLocation?.[ownerID || ""]?.location.x === 0 &&
          heldSqueakStackLocation?.[ownerID || ""]?.location.y === 0) ||
        (heldSqueakStackLocation?.[ownerID || ""]?.location.x ===
          cardOffsetPosition.x &&
          heldSqueakStackLocation?.[ownerID || ""]?.location.y ===
            cardOffsetPosition.y))
    ) {
      transitionStyles = "transform 325ms ease-out";
    } else if (ownerID === userID) {
      transitionStyles = "filter 163ms ease-in-out";
    } else {
      transitionStyles = "none";
    }

    return transitionStyles;
  }

  function getCardAssetPath(): StaticImageData {
    if (manuallyShowSpecificCardFront) {
      return cardAssets[
        `${suit}${value}${
          manuallyShowSpecificCardFront === "simple" ? "Simple" : ""
        }`
      ] as StaticImageData;
    }

    return cardAssets[
      `${suit}${value}${prefersSimpleCardAssets ? "Simple" : ""}`
    ] as StaticImageData;
  }

  return (
    <>
      {(showCardBack || value || suit) && (
        <Draggable
          disabled={!draggable}
          onDrag={(e, data) => dragHandler(e, data)}
          position={
            inMovingSqueakStack
              ? heldSqueakStackLocation?.[ownerID || ""]?.location
              : cardOffsetPosition
          }
          onStop={() => dropHandler()}
        >
          <div
            ref={cardRef}
            style={{
              width: width,
              height: height,
              transition: getTransitionStyles(),
              zIndex:
                inMovingSqueakStack ||
                cardOffsetPosition.x !== 0 ||
                cardOffsetPosition.y !== 0
                  ? 150
                  : origin === "deck"
                    ? 50
                    : 100, // makes sure child cards stay on top whenever moving
            }}
            className={`baseFlex relative h-full w-full select-none !items-start ${
              draggable && "cursor-grab hover:active:cursor-grabbing"
            }`}
          >
            <img
              ref={imageRef}
              style={{
                width: width,
                height: height,
                filter:
                  showCardBack && !forceShowCardFront
                    ? `hue-rotate(${hueRotation}deg)`
                    : "none",
                transform:
                  userID === ownerID &&
                  origin !== "deck" &&
                  origin !== "squeakDeck" &&
                  (inMovingSqueakStack ||
                    cardOffsetPosition.x !== 0 ||
                    cardOffsetPosition.y !== 0)
                    ? "scale(1.05)"
                    : "scale(1)",
                transition: "transform 325ms ease-out",
              }}
              className="cardDimensions pointer-events-none select-none rounded-[0.15rem]"
              src={
                showCardBack && !forceShowCardFront
                  ? (cardAssets["cardBack"] as StaticImageData).src
                  : getCardAssetPath().src
              }
              alt={
                showCardBack && !forceShowCardFront
                  ? "Back of card"
                  : `${value}${suit} card`
              }
              draggable="false"
            />
          </div>
        </Draggable>
      )}
    </>
  );
}

export default Card;
