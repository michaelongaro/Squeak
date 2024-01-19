import { useState, useRef, useCallback } from "react";
import React from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import { socket } from "../../pages/";
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
    (
      { x, y }: { x: number; y: number },
      flip: boolean,
      rotate: boolean,
      callbackFunction?: () => void
    ) => {
      if (!cardRef.current || !imageRef.current) return;

      let start: number | undefined;
      let done = false;

      function animationEndHandler() {
        if (!cardRef.current || !imageRef.current) return;

        cardRef.current.style.transition = "none";
        cardRef.current.style.zIndex = "100";
        imageRef.current.style.transition = "none";
        imageRef.current.style.zIndex = "100";

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

      cardRef.current.style.transition = "all 300ms ease-in-out, filter 150ms";
      imageRef.current.style.transition = "transform 150ms linear";

      const currentImageTransform = imageRef.current.style.transform;

      if (origin === "hand" && ownerID === userID) {
        setHoldingADeckCard(false);
      } else if (origin === "squeakDeck" && ownerID === userID) {
        setHoldingASqueakCard(false);
      }

      if (x === 0 && y === 0) {
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
            Math.floor(x - currentX),
            Math.floor(y - currentY),
            rotation
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

          imageRef.current.style.transform = currentImageTransform.replace(
            "rotateY(90deg)",
            "rotateY(0deg)"
          );

          setForceShowCardFront(true);
        }, 150);
      }

      function step(timestamp: number) {
        if (start === undefined) {
          start = timestamp;
        }
        const elapsed = timestamp - start;

        // trying to add slight buffer around the regular 300ms animation
        if (elapsed < 325) {
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
    ]
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
    moveCard({ x: 0, y: 0 }, false, false);

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
      moveCard({ x: 0, y: 0 }, false, false);
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

  function getAnimationStyles() {
    let animation = "none";

    if (
      ownerID !== userID &&
      (cardOffsetPosition.x !== 0 ||
        cardOffsetPosition.y !== 0 ||
        inMovingSqueakStack)
    ) {
      if (origin === "hand" || origin === "squeakHand") {
        animation = "regularCardDropShadow 100ms ease-in-out";
      }
    }

    return animation;
  }

  function getFilterStyles() {
    let filterStyles = "none";

    if (
      ownerID === userID &&
      origin !== "deck" &&
      origin !== "squeakDeck" &&
      (cardOffsetPosition.x !== 0 ||
        cardOffsetPosition.y !== 0 ||
        inMovingSqueakStack)
    ) {
      filterStyles = `drop-shadow(8px 8px 4px rgba(0, 0, 0, ${
        inMovingSqueakStack ? 0.1 : 0.25
      }))`;
    }

    return filterStyles;
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
      transitionStyles =
        "transform 300ms ease-in-out, filter 100ms ease-in-out";
    } else if (ownerID === userID) {
      transitionStyles = "filter 150ms ease-in-out";
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
              animation: getAnimationStyles(),
              filter: getFilterStyles(),
              transition: getTransitionStyles(),
              zIndex:
                inMovingSqueakStack ||
                cardOffsetPosition.x !== 0 ||
                cardOffsetPosition.y !== 0
                  ? 150
                  : origin === "deck"
                  ? 50
                  : 100, // makes sure child cards stay on top whenever moving
              // TODO: should probably have _all_ styles be directly tied to state, instead of manually
              // setting the .style properties above in moveCard()
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
              }}
              className="pointer-events-none h-[64px] w-[48px] select-none rounded-[0.25rem] tall:h-[87px] tall:w-[67px]"
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
