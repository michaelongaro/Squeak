import { useState, useRef, useCallback, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../../context/UserIDContext";
import {
  type IHeldSqueakStackLocation,
  useRoomContext,
} from "../../context/RoomContext";
import cardPlacementIsValid from "../../utils/cardPlacementIsValid";
import useCardDrawFromDeck from "../../hooks/useCardDrawFromDeck";
import useCardDrawFromSqueakDeck from "../../hooks/useCardDrawFromSqueakDeck";
import useCardDropApproved from "../../hooks/useCardDropApproved";
import useCardDropDenied from "../../hooks/useCardDropDenied";
import { adjustCoordinatesByRotation } from "../../utils/adjustCoordinatesByRotation";
import { type StaticImageData } from "next/image";
import { cardAssets } from "../../utils/cardAssetPaths";
import useInitialCardDrawForSqueakStack from "~/hooks/useInitialCardDrawForSqueakStack";
import { getCardAssetPath } from "~/utils/getCardAssetPath";

function getTransitionStyles(
  inMovingSqueakStack: boolean,
  holdingASqueakCard: boolean,
  heldSqueakStackLocation: IHeldSqueakStackLocation | null,
  cardOffsetPosition: { x: number; y: number },
  ownerID: string,
  userID: string,
) {
  let transitionStyles = "";

  if (
    inMovingSqueakStack &&
    (!holdingASqueakCard ||
      (heldSqueakStackLocation?.[ownerID]?.location.x === 0 &&
        heldSqueakStackLocation?.[ownerID]?.location.y === 0) ||
      (heldSqueakStackLocation?.[ownerID]?.location.x ===
        cardOffsetPosition.x &&
        heldSqueakStackLocation?.[ownerID]?.location.y ===
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

interface IPosition {
  x: number;
  y: number;
}

function formatOffsetPosition(offset: IPosition | undefined) {
  if (offset === undefined) {
    return "translate(0px, 0px)";
  }
  return `translate(${offset.x}px, ${offset.y}px)`;
}

export interface IMoveCard {
  newPosition: { x: number; y: number };
  pseudoVerticalDepthDifferential?: number;
  flip: boolean;
  rotate: boolean;
  callbackFunction?: () => void;
}

interface ICardComponent {
  value?: string;
  suit?: string;
  showCardBack?: boolean;
  draggable: boolean;
  origin: "deck" | "hand" | "squeakHand" | "squeakDeck";
  ownerID: string;
  startID: string;
  squeakStackLocation?: [number, number];
  rotation: number;
  hueRotation: number;
  width?: number;
  height?: number;
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
    deckVariantIndex,
    setHoldingADeckCard,
    setHoldingASqueakCard,
    squeakStackDragAlterations,
    setSqueakStackDragAlterations,
  } = useRoomContext();

  const [isDragging, setIsDragging] = useState(false);
  const [cardOffsetPosition, setCardOffsetPosition] = useState<IPosition>({
    x: 0,
    y: 0,
  });
  const [dragStart, setDragStart] = useState<IPosition>({ x: 0, y: 0 });
  const [forceShowCardFront, setForceShowCardFront] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const inMovingSqueakStack = (() => {
    if (
      squeakStackLocation === undefined ||
      heldSqueakStackLocation === null ||
      heldSqueakStackLocation[ownerID] === null
    )
      return false;

    const location = heldSqueakStackLocation[ownerID];

    if (!location) return false;

    // not sure these variable names are the best
    const [heldX, heldY] = location.squeakStack;
    const [currentX, currentY] = squeakStackLocation;

    return heldX === currentX && heldY < currentY;
  })();

  // really dislike this being "necessary", but for whatever reason
  // heldSqueakStackLocation and squeakStackDragAlterations were just
  // not being reset always, I think the issue was exacerbated on lower end devices?
  const [initSqueakStackResetComplete, setInitSqueakStackResetComplete] =
    useState(false);

  useEffect(() => {
    if (initSqueakStackResetComplete) return;
    setInitSqueakStackResetComplete(true);

    if (squeakStackLocation !== undefined) {
      setHeldSqueakStackLocation({
        ...heldSqueakStackLocation,
        [ownerID]: null,
      });

      setSqueakStackDragAlterations({
        ...squeakStackDragAlterations,
        [ownerID]: {
          squeakStackDepthAlterations: [0, 0, 0, 0],
          draggedStack: undefined,
        },
      });
    }
  }, [
    heldSqueakStackLocation,
    ownerID,
    setHeldSqueakStackLocation,
    squeakStackLocation,
    initSqueakStackResetComplete,
    squeakStackDragAlterations,
    setSqueakStackDragAlterations,
  ]);

  const moveCard = useCallback(
    ({
      newPosition,
      flip,
      rotate,
      callbackFunction,
      pseudoVerticalDepthDifferential = 0,
    }: IMoveCard) => {
      if (!cardRef.current || !imageRef.current) return;

      let start: number | undefined;
      let done = false;

      function animationEndHandler() {
        if (!cardRef.current || !imageRef.current) return;

        const squeakStackContainerIndex =
          origin === "squeakHand" && squeakStackLocation?.[0] !== undefined
            ? squeakStackLocation[0]
            : null;

        const squeakStackContainerID =
          squeakStackContainerIndex !== null
            ? `${ownerID}squeakHand${squeakStackContainerIndex}`
            : null;

        if (squeakStackContainerID) {
          const squeakStackContainer = document.getElementById(
            squeakStackContainerID,
          );

          if (squeakStackContainer) {
            // loop through all of the cards including/below the one being moved
            for (
              let i = squeakStackLocation![1];
              i < squeakStackContainer.children.length;
              i++
            ) {
              const cardContainer = squeakStackContainer.children[
                i
              ] as HTMLDivElement;

              // then the first child of cardContainer is the "cardRef" equivalent,
              // and the first child of the "cardRef" is the "imageRef" equivalent,
              // so we access these elements and apply the same styles as we do in the
              // moveCard function
              const card = cardContainer.children[0] as HTMLDivElement;
              const image = card.children[0] as HTMLImageElement;

              card.style.transition = "none";
              card.style.zIndex = "100";
              card.style.pointerEvents = "auto";
              card.style.willChange = "auto";

              image.style.zIndex = "100";
              image.style.willChange = "auto";
            }
          }
        } else {
          cardRef.current.style.transition = "none";
          cardRef.current.style.zIndex = "100";
          cardRef.current.style.pointerEvents = "auto";
          cardRef.current.style.willChange = "auto";

          imageRef.current.style.zIndex = "100";
          imageRef.current.style.willChange = "auto";
        }

        if (origin === "hand" || origin === "squeakHand") {
          setCardBeingMovedProgramatically({
            ...cardBeingMovedProgramatically,
            [ownerID]: false,
          });
        } else if (origin === "squeakDeck") {
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

        if (squeakStackLocation) {
          setHeldSqueakStackLocation({
            ...heldSqueakStackLocation,
            [ownerID]: null,
          });
        }
      }

      if (origin === "hand" || origin === "squeakHand") {
        setCardBeingMovedProgramatically({
          ...cardBeingMovedProgramatically,
          [ownerID]: true,
        });
      } else if (origin === "squeakDeck") {
        setSqueakDeckBeingMovedProgramatically({
          ...squeakDeckBeingMovedProgramatically,
          [ownerID]: true,
        });
      }

      const squeakStackContainerIndex =
        origin === "squeakHand" && squeakStackLocation?.[0] !== undefined
          ? squeakStackLocation[0]
          : null;

      const squeakStackContainerID =
        squeakStackContainerIndex !== null
          ? `${ownerID}squeakHand${squeakStackContainerIndex}`
          : null;

      if (squeakStackContainerID) {
        const squeakStackContainer = document.getElementById(
          squeakStackContainerID,
        );

        if (squeakStackContainer) {
          // loop through all of the cards including/below the one being moved
          for (
            let i = squeakStackLocation![1];
            i < squeakStackContainer.children.length;
            i++
          ) {
            const cardContainer = squeakStackContainer.children[
              i
            ] as HTMLDivElement;

            // then the first child of cardContainer is the "cardRef" equivalent,
            // and the first child of the "cardRef" is the "imageRef" equivalent,
            // so we access these elements and apply the same styles as we do in the
            // moveCard function
            const card = cardContainer.children[0] as HTMLDivElement;
            const image = card.children[0] as HTMLImageElement;

            card.style.willChange = "transform";

            if (origin === "deck" || origin === "squeakDeck") {
              image.style.willChange = "transform, filter, boxShadow";
            } else {
              image.style.willChange = "transform, filter";
            }

            card.style.transition = "all 325ms ease-out, filter 163ms";
            if (origin === "deck" || origin === "squeakDeck") {
              image.style.transition =
                "transform 163ms ease-out, boxShadow 163ms ease-out";
            } else {
              image.style.transition = "transform 163ms ease-out";
            }
            image.style.transform = "scale(1)";
          }
        }
      } else {
        cardRef.current.style.willChange = "transform";
        imageRef.current.style.willChange = "transform, filter";

        cardRef.current.style.transition = "all 325ms ease-out, filter 163ms";
        imageRef.current.style.transition = "transform 163ms ease-out";
        imageRef.current.style.transform = "scale(1)";
      }

      const currentImageTransform = imageRef.current.style.transform;

      if (origin === "hand" && ownerID === userID) {
        setHoldingADeckCard(false);
      } else if (origin === "squeakHand" && ownerID === userID) {
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

        if (squeakStackLocation) {
          setHeldSqueakStackLocation({
            ...heldSqueakStackLocation,
            [ownerID]: {
              squeakStack: squeakStackLocation,
              location: { x: 0, y: 0 },
            },
          });
        }
      } else {
        const currentCard = document.getElementById(startID);

        if (!currentCard) return;

        const { x: currentX, y: currentY } =
          currentCard.getBoundingClientRect();

        const { x: endXCoordinate, y: endYCoordinate } =
          adjustCoordinatesByRotation(
            newPosition.x - currentX,
            newPosition.y - currentY,
            rotation,
            pseudoVerticalDepthDifferential,
          );

        setCardOffsetPosition({
          x: endXCoordinate,
          y: endYCoordinate,
        });

        if (squeakStackLocation) {
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

      // helps to differentiate the moving card from the rest of the deck. previously
      // I had box shadows on all moving cards but I think it caused performance issues
      if (origin === "deck" || origin === "squeakDeck") {
        imageRef.current.style.boxShadow = "0px 0px 4px 0px rgb(0, 0, 0)";
      }

      if (flip) {
        if (!cardRef.current) return;

        // tiny X rotation is meant to add slight realism to card flip,
        // entirely fine with reverting if the effect doesn't land well

        imageRef.current.style.transform =
          currentImageTransform + " rotateX(3deg) rotateY(90deg)";

        setTimeout(() => {
          if (!imageRef.current) return;

          setForceShowCardFront(true);

          imageRef.current.style.transform = currentImageTransform.replace(
            "rotateX(3deg) rotateY(90deg)",
            "rotateX(0deg) rotateY(0deg)",
          );

          if (origin === "deck" || origin === "squeakDeck") {
            imageRef.current.style.boxShadow = "none";
          }
        }, 163);
      }

      function step(timestamp: number) {
        if (start === undefined) {
          start = timestamp;
        }
        const elapsed = timestamp - start;

        // 325ms is the duration of the card movement animation
        // FYI: we had a +25ms "buffer" on this value before, but I really don't
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

  const moveCardBackToOriginWithSound = useCallback(
    (originSqueakStackIndex?: number) => {
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
    },
    [
      audioContext,
      hoveredSqueakStack,
      masterVolumeGainNode,
      moveCard,
      notAllowedMoveBuffer,
    ],
  );

  const dropHandler = useCallback(() => {
    // hand start + board end
    if (holdingADeckCard && hoveredCell && value && suit) {
      const [row, col] = hoveredCell;

      const boardCell = gameData?.board?.[row]?.[col] || null;

      if (cardPlacementIsValid(boardCell, value, suit, true)) {
        socket.volatile.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          handStart: true,
          boardEndLocation: { row, col },
          playerID: userID,
          roomCode: roomConfig.code,
        });
      } else {
        moveCardBackToOriginWithSound();
      }
    }

    // hand start + squeak end
    else if (holdingADeckCard && hoveredSqueakStack !== null && value && suit) {
      const idx = hoveredSqueakStack;

      const bottomSqueakStackCard =
        gameData.players?.[userID]?.squeakHand?.[idx]?.slice(-1)[0] || null;

      if (cardPlacementIsValid(bottomSqueakStackCard, value, suit, false)) {
        socket.volatile.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          handStart: true,
          squeakStackEndIndex: idx,
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
        socket.volatile.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          squeakStackStartIndex: originIndexForHeldSqueakCard,
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
        socket.volatile.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          squeakStackStartIndex: originIndexForHeldSqueakCard,
          squeakStackEndIndex: hoveredSqueakStack,
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
  }, [
    gameData?.board,
    gameData.players,
    holdingADeckCard,
    holdingASqueakCard,
    hoveredCell,
    hoveredSqueakStack,
    moveCard,
    moveCardBackToOriginWithSound,
    originIndexForHeldSqueakCard,
    roomConfig.code,
    squeakStackLocation,
    suit,
    userID,
    value,
  ]);

  const dragHandler = useCallback(
    (x: number, y: number) => {
      setCardOffsetPosition({
        x,
        y,
      });

      if (squeakStackLocation) {
        setHeldSqueakStackLocation({
          ...heldSqueakStackLocation,
          [ownerID]: {
            squeakStack: squeakStackLocation,
            location: {
              x,
              y,
            },
          },
        });
      }
    },
    [
      heldSqueakStackLocation,
      ownerID,
      setHeldSqueakStackLocation,
      squeakStackLocation,
    ],
  );

  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggable) return;
      setIsDragging(true);
      setDragStart({
        x: clientX - cardOffsetPosition.x,
        y: clientY - cardOffsetPosition.y,
      });

      if (squeakStackLocation) {
        setHeldSqueakStackLocation({
          ...heldSqueakStackLocation,
          [ownerID]: {
            squeakStack: squeakStackLocation,
            location: {
              x: 0,
              y: 0,
            },
          },
        });
      }
    },
    [
      draggable,
      cardOffsetPosition,
      heldSqueakStackLocation,
      ownerID,
      setHeldSqueakStackLocation,
      squeakStackLocation,
    ],
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const newX = clientX - dragStart.x;
      const newY = clientY - dragStart.y;
      setCardOffsetPosition({ x: newX, y: newY });
      dragHandler(newX, newY);
    },
    [dragStart, dragHandler, isDragging],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dropHandler();
  }, [dropHandler]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientX, e.clientY);
    },
    [handleDragStart],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    },
    [handleDragMove],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      handleDragStart(touch.clientX, touch.clientY);
    },
    [handleDragStart],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      handleDragMove(touch.clientX, touch.clientY);
    },
    [handleDragMove],
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleMouseMove, handleDragEnd, handleTouchMove]);

  return (
    <>
      {(showCardBack || value || suit) && (
        <div
          ref={cardRef}
          style={{
            width: width,
            height: height,
            transition: getTransitionStyles(
              inMovingSqueakStack,
              holdingASqueakCard,
              heldSqueakStackLocation,
              cardOffsetPosition,
              ownerID,
              userID,
            ),
            willChange:
              cardOffsetPosition.x === 0 && cardOffsetPosition.y === 0
                ? "auto"
                : "transform",
            zIndex:
              inMovingSqueakStack ||
              cardOffsetPosition.x !== 0 ||
              cardOffsetPosition.y !== 0
                ? 150
                : origin === "deck"
                  ? 50
                  : 100, // makes sure child cards stay on top whenever moving
            transform: formatOffsetPosition(
              inMovingSqueakStack
                ? heldSqueakStackLocation?.[ownerID]?.location
                : cardOffsetPosition,
            ),
            touchAction: "none",
          }}
          className={`baseFlex relative h-full w-full select-none !items-start ${
            draggable && "cursor-grab hover:active:cursor-grabbing"
          }`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
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
                (isDragging ||
                  inMovingSqueakStack ||
                  cardOffsetPosition.x !== 0 ||
                  cardOffsetPosition.y !== 0)
                  ? "scale(1.05)"
                  : "scale(1)",
              transition: "transform 325ms ease-out",
            }}
            className="cardDimensions pointer-events-none relative left-0 top-0 select-none rounded-[0.15rem]"
            src={
              showCardBack && !forceShowCardFront
                ? (cardAssets["cardBack"] as StaticImageData).src
                : getCardAssetPath({
                    suit: suit ?? "C",
                    value: value ?? "A",
                    deckVariantIndex,
                  }).src
            }
            alt={
              showCardBack && !forceShowCardFront
                ? "Back of card"
                : `${value}${suit} card`
            }
            draggable="false"
          />
        </div>
      )}
    </>
  );
}

export default Card;
