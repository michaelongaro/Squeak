import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import { socket } from "../../pages/";
import { useRoomContext } from "../../context/RoomContext";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import cardPlacementIsValid from "../../utils/cardPlacementIsValid";
import useCardDrawFromDeck from "../../hooks/useCardDrawFromDeck";
import useCardDrawFromSqueakDeck from "../../hooks/useCardDrawFromSqueakDeck";
import useCardDropApproved from "../../hooks/useCardDropApproved";
import useCardDropDenied from "../../hooks/useCardDropDenied";
import { adjustCoordinatesByRotation } from "../../utils/adjustCoordinatesByRotation";

interface ICardComponent {
  value?: string;
  suit?: string;
  showCardBack?: boolean;
  draggable: boolean;
  origin?: "deck" | "squeak";
  ownerID?: string;
  startID?: string;
  squeakStackLocation?: [number, number];
  rotation: number;
  hueRotation?: number;
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
}: ICardComponent) {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

  const [cardOffsetPosition, setCardOffsetPosition] = useState({ x: 0, y: 0 });
  const [cardHasBeenPlaced, setCardHasBeenPlaced] = useState(false);
  const [manuallyShowCardFront, setManuallyShowCardFront] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const cardIsMovingRef = useRef(false);

  const moveCard = useCallback(
    ({ x, y }: { x: number; y: number }, flip: boolean) => {
      if (!cardRef.current || cardIsMovingRef.current) return;

      cardIsMovingRef.current = true;

      cardRef.current.style.transition = "all 0.25s linear"; // ease-in-out
      cardRef.current.style.zIndex = "1000"; // make sure card is on top while moving over other cards

      if (x === 0 && y === 0) {
        if (roomCtx.hoveredCell) {
          roomCtx.setProposedCardBoxShadow({
            id: `cell${roomCtx.hoveredCell[0]}${roomCtx.hoveredCell[1]}`,
            boxShadowValue: `0px 0px 10px 5px rgba(227, 12, 5, 1)`,
          });

          setTimeout(() => {
            roomCtx.setProposedCardBoxShadow(null);
          }, 250);
        } else if (roomCtx.hoveredSqueakStack !== null) {
          roomCtx.setProposedCardBoxShadow({
            id: `${userID}squeakHand${roomCtx.hoveredSqueakStack}`,
            boxShadowValue: `0px 0px 10px 5px rgba(227, 12, 5, 1)`,
          });

          setTimeout(() => {
            roomCtx.setProposedCardBoxShadow(null);
          }, 250);
        }

        setCardOffsetPosition({ x, y });

        if (squeakStackLocation) {
          roomCtx.setHeldSqueakStackLocation({
            squeakStack: squeakStackLocation,
            location: { x: 0, y: 0 },
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

        if (squeakStackLocation) {
          roomCtx.setHeldSqueakStackLocation({
            squeakStack: squeakStackLocation,
            location: { x: endXCoordinate, y: endYCoordinate },
          });
        }

        cardRef.current.style.transform += `rotateZ(${rotation}deg)`;
      }

      if (flip) {
        if (cardRef.current) {
          cardRef.current.style.transform += "rotateY(360deg)"; // could try 90 and then go back to 0 at end?
        }

        setTimeout(() => {
          setManuallyShowCardFront(true);
        }, 125);
      }

      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = "none";
          cardRef.current.style.zIndex = "500";

          if (flip) {
            cardRef.current.style.transform = "translate(0px, 0px)";
            setCardOffsetPosition({
              x: 0,
              y: 0,
            });
            setManuallyShowCardFront(false);
          }
          cardIsMovingRef.current = false;
        }
      }, 250);

      if (origin === "deck") {
        roomCtx.setHoldingADeckCard(false);
      } else if (origin === "squeak") {
        roomCtx.setHoldingASqueakCard(false);
      }
    },
    [origin, roomCtx, squeakStackLocation, rotation, startID, userID]
  );

  // hooks to handle socket emits from server
  useCardDrawFromDeck({
    value,
    suit,
    ownerID,
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
    ownerID,
    userID,
    origin,
    moveCard,
    setCardOffsetPosition,
    setCardHasBeenPlaced,
  });

  useCardDropDenied({
    ownerID,
    moveCard,
  });

  function dropHandler() {
    // deck start + board end
    if (roomCtx.holdingADeckCard && roomCtx.hoveredCell && value && suit) {
      const [row, col] = roomCtx.hoveredCell;

      const boardCell = roomCtx.gameData?.board?.[row]?.[col] || null;

      if (cardPlacementIsValid(boardCell, value, suit, true)) {
        socket.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          deckStart: true,
          boardEndLocation: { row, col },
          playerID: userID,
          roomCode: roomCtx.roomConfig.code,
        });
      } else {
        moveCard({ x: 0, y: 0 }, false);
      }
    }

    // deck start + squeak end
    else if (
      roomCtx.holdingADeckCard &&
      roomCtx.hoveredSqueakStack !== null &&
      value &&
      suit
    ) {
      const idx = roomCtx.hoveredSqueakStack;

      const bottomSqueakStackCard =
        roomCtx.gameData?.players?.[userID!]?.squeakHand?.[idx]?.slice(-1)[0] ||
        null;

      if (cardPlacementIsValid(bottomSqueakStackCard, value, suit, false)) {
        socket.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          deckStart: true,
          squeakEndLocation: idx,
          playerID: userID,
          roomCode: roomCtx.roomConfig.code,
        });
      } else {
        moveCard({ x: 0, y: 0 }, false);
      }
    }

    // squeak start + board end
    else if (
      roomCtx.holdingASqueakCard &&
      roomCtx.hoveredCell &&
      roomCtx.originIndexForHeldSqueakCard !== null &&
      value &&
      suit
    ) {
      const [row, col] = roomCtx.hoveredCell;

      const boardCell = roomCtx.gameData?.board?.[row]?.[col] || null;

      if (cardPlacementIsValid(boardCell, value, suit, true)) {
        socket.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          squeakStartLocation: roomCtx.originIndexForHeldSqueakCard,
          boardEndLocation: { row, col },
          playerID: userID,
          roomCode: roomCtx.roomConfig.code,
        });
      } else {
        moveCard({ x: 0, y: 0 }, false);
      }
    }

    // squeak start + squeak end (I guess you should have a check to make sure you aren't trying to drop a card
    // on the same stack it came from)
    else if (
      roomCtx.holdingASqueakCard &&
      roomCtx.hoveredSqueakStack !== null &&
      roomCtx.originIndexForHeldSqueakCard !== null &&
      value &&
      suit
    ) {
      const idx = roomCtx.hoveredSqueakStack;

      const parentSqueakStackCard =
        roomCtx.gameData?.players?.[userID!]?.squeakHand?.[idx]?.slice(-1)[0] ||
        null;

      if (cardPlacementIsValid(parentSqueakStackCard, value, suit, false)) {
        socket.emit("proposedCardDrop", {
          card: {
            value,
            suit,
          },
          squeakStartLocation: roomCtx.originIndexForHeldSqueakCard,
          squeakEndLocation: roomCtx.hoveredSqueakStack,
          playerID: userID,
          roomCode: roomCtx.roomConfig.code,
        });
      } else {
        moveCard({ x: 0, y: 0 }, false);
      }
    }

    // dropping card over anywhere else
    else {
      moveCard({ x: 0, y: 0 }, false);
    }
  }

  useEffect(() => {
    if (
      squeakStackLocation &&
      roomCtx.resetHeldSqueakStackLocation &&
      roomCtx.resetHeldSqueakStackLocation[0] === squeakStackLocation[0] &&
      roomCtx.resetHeldSqueakStackLocation[1] < squeakStackLocation[1]
    ) {
      moveCard({ x: 0, y: 0 }, false);
      roomCtx.setResetHeldSqueakStackLocation(null);
    }
  }, [squeakStackLocation, roomCtx.resetHeldSqueakStackLocation, moveCard]);

  function dragHandler(e: DraggableEvent, data: DraggableData) {
    const { x, y } = cardOffsetPosition;
    setCardOffsetPosition({
      x: x + data.deltaX,
      y: y + data.deltaY,
    });

    if (squeakStackLocation) {
      roomCtx.setHeldSqueakStackLocation({
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
      {(showCardBack || value || suit) && !cardHasBeenPlaced && userID && (
        <Draggable
          disabled={!draggable}
          onDrag={(e, data) => dragHandler(e, data)}
          position={
            // TODO: extract this to a state w/ an effect listener and/or refactor this
            squeakStackLocation &&
            roomCtx.heldSqueakStackLocation &&
            roomCtx.heldSqueakStackLocation.squeakStack[0] ===
              squeakStackLocation[0] &&
            roomCtx.heldSqueakStackLocation.squeakStack[1] <
              squeakStackLocation[1]
              ? roomCtx.heldSqueakStackLocation.location
              : cardOffsetPosition
          }
          onStop={() => dropHandler()}
        >
          <div
            ref={cardRef}
            className={`relative z-[500] h-full w-full ${
              draggable && "cursor-grab active:cursor-grabbing"
            }`}
            onClick={() => console.log("child clicked")}
          >
            <img
              style={{
                filter:
                  showCardBack && !manuallyShowCardFront
                    ? `hue-rotate(${
                        hueRotation ||
                        roomCtx.playerMetadata[userID]?.deckHueRotation ||
                        "0deg"
                      })`
                    : "",
              }}
              className="pointer-events-none h-[64px] w-[48px] select-none lg:h-[72px] lg:w-[56px]"
              src={
                showCardBack && !manuallyShowCardFront
                  ? "/cards/cardBack.png"
                  : `/cards/${value}${suit}.svg`
              }
              alt={
                showCardBack && !manuallyShowCardFront
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
