import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import { socket } from "../../pages/";
import Image from "next/image";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
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
  origin?: "deck" | "hand" | "squeak";
  ownerID?: string;
  startID?: string;
  squeakStackLocation?: [number, number];
  rotation: number;
  hueRotation?: number;
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
  const {
    gameData,
    roomConfig,
    playerMetadata,
    hoveredCell,
    holdingADeckCard,
    holdingASqueakCard,
    hoveredSqueakStack,
    originIndexForHeldSqueakCard,
    heldSqueakStackLocation,
    setProposedCardBoxShadow,
    setHeldSqueakStackLocation,
    setHoldingADeckCard,
    cardBeingMovedProgramatically,
    setCardBeingMovedProgramatically,
    setHoldingASqueakCard,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const [cardOffsetPosition, setCardOffsetPosition] = useState({ x: 0, y: 0 });
  const [manuallyShowCardFront, setManuallyShowCardFront] = useState(false);

  const [hueRotationDegrees, setHueRotationDegrees] = useState<number>(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const ownerMetadata = ownerID ? playerMetadata[ownerID] : undefined;

    if (hueRotation) {
      setHueRotationDegrees(hueRotation);
    } else if (ownerMetadata) {
      setHueRotationDegrees(ownerMetadata.deckHueRotation);
    } else {
      setHueRotationDegrees(0);
    }
  }, [hueRotation, ownerID, playerMetadata]);

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

        if (origin === "hand" && ownerID) {
          setCardBeingMovedProgramatically({
            ...cardBeingMovedProgramatically,
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

      if (origin === "hand" && ownerID) {
        setCardBeingMovedProgramatically({
          ...cardBeingMovedProgramatically,
          [ownerID]: true,
        });
      }

      // make sure card stays on top, but below shuffling modal while moving over other cards
      cardRef.current.style.transition = "all 0.25s linear";
      cardRef.current.style.zIndex = "998";
      imageRef.current.style.transition = "transform 0.125s linear";
      imageRef.current.style.zIndex = "998";

      const currentTransform = imageRef.current.style.transform;

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
            currentTransform + ` rotateZ(${rotation}deg)`;
        }
      }

      if (flip) {
        if (!cardRef.current) return;

        imageRef.current.style.transform = currentTransform + " rotateY(90deg)";

        setTimeout(() => {
          if (!imageRef.current) return;

          imageRef.current.style.transform = currentTransform.replace(
            "rotateY(90deg)",
            "rotateY(0deg)"
          );

          setManuallyShowCardFront(true);
        }, 125);
      }

      function step(timestamp: number) {
        if (start === undefined) {
          start = timestamp;
        }
        const elapsed = timestamp - start;

        // feels wrong because animation should only be running for 250ms, but 250
        // resulted in the animation getting cut off before it finished
        if (elapsed < 300) {
          if (!done) {
            window.requestAnimationFrame(step);
          }
        } else {
          animationEndHandler();
          done = true;
        }
      }

      window.requestAnimationFrame(step);

      if (origin === "hand" && ownerID === userID) {
        setHoldingADeckCard(false);
      } else if (origin === "squeak" && ownerID === userID) {
        setHoldingASqueakCard(false);
      }
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
    origin,
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
    const { x, y } = cardOffsetPosition;
    setCardOffsetPosition({
      x: x + data.deltaX,
      y: y + data.deltaY,
    });

    if (squeakStackLocation) {
      setHeldSqueakStackLocation({
        squeakStack: squeakStackLocation,
        location: {
          x: x + data.deltaX,
          y: y + data.deltaY,
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
            // TODO: extract this to a state w/ an effect listener and/or refactor this
            squeakStackLocation &&
            heldSqueakStackLocation &&
            heldSqueakStackLocation.squeakStack[0] === squeakStackLocation[0] &&
            heldSqueakStackLocation.squeakStack[1] < squeakStackLocation[1]
              ? heldSqueakStackLocation.location
              : cardOffsetPosition
          }
          onStop={() => dropHandler()}
        >
          <div
            ref={cardRef}
            style={{
              transition:
                squeakStackLocation &&
                heldSqueakStackLocation &&
                heldSqueakStackLocation.squeakStack[0] ===
                  squeakStackLocation[0] &&
                heldSqueakStackLocation.squeakStack[1] <
                  squeakStackLocation[1] &&
                heldSqueakStackLocation.location.x === 0 &&
                heldSqueakStackLocation.location.y === 0
                  ? "transform 0.25s linear"
                  : "none",
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
                    ? `hue-rotate(${hueRotationDegrees}deg)`
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
