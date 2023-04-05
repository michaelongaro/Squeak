import { useState, useRef, useCallback } from "react";
import React from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import { socket } from "../../pages/";
import Image from "next/image";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import cardPlacementIsValid from "../../utils/cardPlacementIsValid";
import useCardDrawFromDeck from "../../hooks/useCardDrawFromDeck";
import useCardDrawFromSqueakDeck from "../../hooks/useCardDrawFromSqueakDeck";
import useCardDropApproved from "../../hooks/useCardDropApproved";
import useCardDropDenied from "../../hooks/useCardDropDenied";
import { adjustCoordinatesByRotation } from "../../utils/adjustCoordinatesByRotation";
import { cards } from "../../utils/cardAssetPaths";

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
  width?: string;
  height?: string;
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
    setProposedCardBoxShadow,
    setHeldSqueakStackLocation,
    cardBeingMovedProgramatically,
    setCardBeingMovedProgramatically,
    squeakDeckBeingMovedProgramatically,
    setSqueakDeckBeingMovedProgramatically,
    setHoldingADeckCard,
    setHoldingASqueakCard,
  } = useRoomContext();

  const [cardOffsetPosition, setCardOffsetPosition] = useState({ x: 0, y: 0 });
  const [manuallyShowCardFront, setManuallyShowCardFront] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const inMovingSqueakStack =
    (squeakStackLocation &&
      heldSqueakStackLocation &&
      heldSqueakStackLocation.squeakStack[0] === squeakStackLocation[0] &&
      heldSqueakStackLocation.squeakStack[1] < squeakStackLocation[1]) ??
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
        cardRef.current.style.zIndex = "500";
        imageRef.current.style.transition = "none";
        imageRef.current.style.zIndex = "500";

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

        if (squeakStackLocation && ownerID === userID) {
          setHeldSqueakStackLocation(null);
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

      cardRef.current.style.transition = "all 300ms linear";
      imageRef.current.style.transition = "transform 150ms linear";

      // workaround to have cards played on board from squeak stacks stay above all
      // other cards
      if (squeakStackLocation && !flip) {
        cardRef.current.style.zIndex = "998";
        imageRef.current.style.zIndex = "998";
      }

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
        } else if (hoveredSqueakStack !== null) {
          setProposedCardBoxShadow({
            id: `${userID}squeakHand${hoveredSqueakStack}`,
            boxShadowValue: `0px 0px 4px 3px rgba(227, 12, 5, 1)`,
          });

          setTimeout(() => {
            setProposedCardBoxShadow(null);
          }, 250);
        }

        setCardOffsetPosition({ x, y });

        if (squeakStackLocation) {
          setHeldSqueakStackLocation({
            squeakStack: squeakStackLocation,
            location: { x, y },
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

        // data only valid if card is being moved from a squeak stack and the current user
        // is the owner of the card being moved
        if (squeakStackLocation && ownerID === userID) {
          setHeldSqueakStackLocation({
            squeakStack: squeakStackLocation,
            location: { x: endXCoordinate, y: endYCoordinate },
          });
        }

        // cards are symmetrical across y-axis so need to rotate when card is already
        // in correct orientation relative to how it will look on the board
        if (rotate) {
          imageRef.current.style.transform =
            currentImageTransform + ` rotateZ(${rotation * -1}deg)`;
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

          setManuallyShowCardFront(true);
        }, 150);
      }

      function step(timestamp: number) {
        if (start === undefined) {
          start = timestamp;
        }
        const elapsed = timestamp - start;

        // longer delay for other players to allow for animation to
        // play out better. I feel like this shouldn't be necessary
        // since every animation has same duration
        const delay = ownerID === userID ? 385 : 425;

        if (elapsed < delay) {
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
      setHeldSqueakStackLocation,
      setHoldingADeckCard,
      setHoldingASqueakCard,
      setProposedCardBoxShadow,
      cardBeingMovedProgramatically,
      setCardBeingMovedProgramatically,
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
    ownerID,
    moveCard,
  });

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
        moveCard({ x: 0, y: 0 }, false, false);
      }
    }

    // deck start + squeak end
    else if (holdingADeckCard && hoveredSqueakStack !== null && value && suit) {
      const idx = hoveredSqueakStack;

      const bottomSqueakStackCard =
        gameData?.players?.[userID!]?.squeakHand?.[idx]?.slice(-1)[0] || null;

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
        moveCard({ x: 0, y: 0 }, false, false);
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
        moveCard({ x: 0, y: 0 }, false, false);
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
        moveCard({ x: 0, y: 0 }, false, false);
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

    if (squeakStackLocation) {
      setHeldSqueakStackLocation({
        squeakStack: squeakStackLocation,
        location: {
          x: data.x,
          y: data.y,
        },
      });
    }
  }

  return (
    <>
      {(showCardBack || value || suit) && (
        <Draggable
          disabled={!draggable}
          onDrag={(e, data) => dragHandler(e, data)}
          position={
            inMovingSqueakStack
              ? heldSqueakStackLocation?.location
              : cardOffsetPosition
          }
          onStop={() => dropHandler()}
        >
          <div
            ref={cardRef}
            style={{
              animation:
                ownerID !== userID &&
                (cardOffsetPosition.x !== 0 ||
                  cardOffsetPosition.y !== 0 ||
                  inMovingSqueakStack)
                  ? origin === "hand" || origin === "squeakHand"
                    ? "regularCardDropShadow 0.3s linear"
                    : origin === "deck" || origin === "squeakDeck"
                    ? "shallowCardDropShadow 0.3s linear"
                    : "none"
                  : "none",
              filter:
                ownerID === userID &&
                (cardOffsetPosition.x !== 0 ||
                  cardOffsetPosition.y !== 0 ||
                  inMovingSqueakStack)
                  ? origin === "hand" || origin === "squeakHand"
                    ? `drop-shadow(10px 10px 4px rgba(0, 0, 0, ${
                        inMovingSqueakStack ? 0.1 : 0.25
                      }))`
                    : origin === "deck" || origin === "squeakDeck"
                    ? "drop-shadow(5px 5px 4px rgba(0, 0, 0, 0.15))"
                    : "drop-shadow(0px 0px 4px rgba(0, 0, 0, 0))"
                  : "drop-shadow(0px 0px 4px rgba(0, 0, 0, 0))",
              transition:
                inMovingSqueakStack &&
                (!holdingASqueakCard ||
                  (heldSqueakStackLocation?.location.x === 0 &&
                    heldSqueakStackLocation?.location.y === 0) ||
                  (heldSqueakStackLocation?.location.x ===
                    cardOffsetPosition.x &&
                    heldSqueakStackLocation?.location.y ===
                      cardOffsetPosition.y))
                  ? "transform 300ms linear, filter 300ms linear"
                  : ownerID === userID
                  ? `filter 300ms linear`
                  : "none",
              zIndex: inMovingSqueakStack ? 1000 : 500, // makes sure child cards stay on top of parent in moving stack
            }}
            className={`baseFlex relative z-[500] h-full w-full select-none !items-start ${
              draggable && "cursor-grab hover:active:cursor-grabbing"
            }`}
          >
            <Image
              ref={imageRef}
              style={{
                width: width,
                height: height,
                filter:
                  showCardBack && !manuallyShowCardFront
                    ? `hue-rotate(${hueRotation}deg)`
                    : "none",
              }}
              className="pointer-events-none h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]"
              src={
                showCardBack && !manuallyShowCardFront
                  ? cards["cardBack"]
                  : // @ts-expect-error asdf
                    cards[`${suit}${value}`]
              }
              alt={
                showCardBack && !manuallyShowCardFront
                  ? "Back of card"
                  : `${value}${suit} card`
              }
              priority={true}
              draggable="false"
            />
          </div>
        </Draggable>
      )}
    </>
  );
}

export default Card;
