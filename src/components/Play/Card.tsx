import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import React from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import { socket } from "../../pages/";
import { useRoomContext } from "../../context/RoomContext";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import cardPlacementIsValid from "../../utils/cardPlacementIsValid";
import {
  type IDrawFromSqueakDeck,
  type ICardDropProposal,
  type IDrawFromDeck,
} from "../../pages/api/socket";
import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import { type IAnimationConfig } from "./OtherPlayersCardContainers";

interface ICardComponent {
  value?: string;
  suit?: string;
  showCardBack?: boolean;
  draggable: boolean;
  origin?: "deck" | "squeak";
  ownerID?: string;
  startID?: string;
  squeakStackLocation?: [number, number];
  animationConfig: IAnimationConfig;
}

interface ICardDropAccepted extends Partial<ICardDropProposal> {
  squeakEndCoords?: {
    squeakStack: ICard[];
    stackOfCardsMoved: ICard[];
    col: number;
    row: number;
  };
  endID: string; // have this here or on main interface?
}

function Card({
  value,
  suit,
  showCardBack,
  draggable,
  startID,
  origin,
  ownerID,
  animationConfig,
  squeakStackLocation,
}: ICardComponent) {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

  const [cardOffsetPosition, setCardOffsetPosition] = useState({ x: 0, y: 0 });
  const [cardHasBeenPlaced, setCardHasBeenPlaced] = useState(false);
  const [manuallyShowCardFront, setManuallyShowCardFront] = useState(false);
  const [cardIsMoving, setCardIsMoving] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const moveCard = useCallback(
    ({ x, y }: { x: number; y: number }, flip: boolean) => {
      console.log("moveCard called with", value, suit);

      if (cardRef.current && !cardIsMoving) {
        setCardIsMoving(true); // hopefully still allows full pass of function after this call..

        cardRef.current.style.transition = "all 10s linear"; // ease-in-out

        if (x === 0 && y === 0) {
          console.log("card is being moved back to original position");

          setCardOffsetPosition({ x, y });
        } else if (startID) {
          const currentCard = document.getElementById(startID); // if any reason at all, why not just use ref?

          if (currentCard) {
            const currentCardPosition = currentCard.getBoundingClientRect();

            console.log("animation config is", animationConfig);

            const endXCoordinate =
              Math.floor(x - currentCardPosition.x) *
              animationConfig.xMultiplier;
            const endYCoordinate =
              Math.floor(y - currentCardPosition.y) *
              animationConfig.yMultiplier;

            console.log("card offset is", endXCoordinate, " ", endYCoordinate);
            setCardOffsetPosition({
              x: endXCoordinate,
              y: endYCoordinate,
            });

            cardRef.current.style.transform += `rotateZ(${animationConfig.rotation}deg)`;
          }
        }

        if (flip) {
          if (cardRef.current) {
            cardRef.current.style.zIndex = "1000"; // make sure card is on top while moving over other cards
            console.log("pre transform: ", cardRef.current.style.transform);
            cardRef.current.style.transform += "rotateY(90deg)";
            console.log("post transform: ", cardRef.current.style.transform);
          }

          setTimeout(() => {
            setManuallyShowCardFront(true);
          }, 5000);
        }

        if (squeakStackLocation) {
          roomCtx.setHeldSqueakStackLocation({
            squeakStack: squeakStackLocation,
            location: { x, y },
          });
        }

        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.zIndex = "auto"; // or go back to 500?
            cardRef.current.style.transition = "none";
            setCardIsMoving(false);
          }
        }, 10000); //150

        if (origin === "deck") {
          roomCtx.setHoldingADeckCard(false);
        } else if (origin === "squeak") {
          roomCtx.setHoldingASqueakCard(false);
        }
      }
    },
    [
      origin,
      roomCtx,
      squeakStackLocation,
      startID,
      animationConfig,
      cardIsMoving,
      suit,
      value,
    ]
  );

  const handleCardDrawnFromSqueakDeck = useCallback(
    ({
      playerID,
      indexToDrawTo,
      updatedBoard,
      newCard,
      updatedPlayerCards,
    }: IDrawFromSqueakDeck) => {
      if (
        playerID !== ownerID ||
        newCard?.suit !== suit ||
        newCard?.value !== value
      )
        return;

      const endID = `${playerID}squeakHand${indexToDrawTo}`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();

      console.log(
        "endID: ",
        endID,
        playerID,
        ownerID,
        newCard?.suit,
        suit,
        newCard?.value,
        value
      );

      if (endLocation) {
        const endX = endLocation.x;
        const endY = endLocation.y;

        moveCard({ x: endX, y: endY }, true);

        setTimeout(() => {
          console.log("setting game data nyow");

          roomCtx.setGameData({
            ...roomCtx.gameData,
            board: updatedBoard || roomCtx.gameData?.board,
            players: updatedPlayerCards || roomCtx.gameData?.players,
          });

          setCardHasBeenPlaced(true);
        }, 10000);
      } else {
        console.log("end location not found"); // eventually delete this else part
      }
    },
    [roomCtx, moveCard, suit, value, ownerID]
  );

  const handleCardDrawnFromDeck = useCallback(
    ({
      topCard,
      playerID,
      updatedBoard,
      updatedPlayerCards,
    }: IDrawFromDeck) => {
      if (
        playerID !== userID ||
        topCard?.suit !== suit ||
        topCard?.value !== value
      )
        return;

      const endID = `${playerID}hand`;

      const endLocation = document
        .getElementById(endID)
        ?.getBoundingClientRect();
      if (endLocation) {
        const endX = endLocation.x;
        const endY = endLocation.y;

        moveCard({ x: endX, y: endY }, true);

        setTimeout(() => {
          roomCtx.setGameData({
            ...roomCtx.gameData,
            board: updatedBoard || roomCtx.gameData?.board,
            players: updatedPlayerCards || roomCtx.gameData?.players,
          });

          setCardHasBeenPlaced(true);
        }, 10000);
      } else {
        console.log("end location not found"); // eventually delete this else part
      }
    },
    [roomCtx, moveCard, suit, value, userID]
  );

  const handleDeniedCardDrop = useCallback(
    ({ playerID }: Partial<ICardDropProposal>) => {
      if (playerID === ownerID) {
        // red box shadow stuff here
        moveCard({ x: 0, y: 0 }, false);
      }
    },
    [moveCard, ownerID]
  );

  const handleApprovedCardDrop = useCallback(
    ({
      card,
      endID,
      squeakEndCoords, // used just to know whether or not the card is a child of the card that was dropped
      updatedBoard,
      updatedPlayerCards,
      playerID,
    }: ICardDropAccepted) => {
      // check to see if current card is a child of the card that was dropped
      let childOfCardThatWasDropped = false;
      if (
        // squeakStartLocation &&
        // squeakEndCoords implies that it was a squeak -> squeak move
        squeakEndCoords &&
        value &&
        suit
      ) {
        if (
          squeakEndCoords.stackOfCardsMoved.some(
            (card) => card.value === value && card.suit === suit
          )
        ) {
          childOfCardThatWasDropped = true;
        }
      }

      // making sure card + playerID match up to this <Card />
      if (
        (card &&
          card.value === value &&
          card.suit === suit &&
          playerID === ownerID) ||
        (childOfCardThatWasDropped && playerID === ownerID)
      ) {
        // prob can stay right here, but maybe only want to do if it's the current player's card?
        // if (playerID === userID) {
        //   if (origin === "deck") {
        //     roomCtx.setHoldingADeckCard(false);
        //   } else if (origin === "squeak") {
        //     roomCtx.setHoldingASqueakCard(false);
        //   }
        // }

        console.log(endID);

        const endLocation = document
          .getElementById(endID)
          ?.getBoundingClientRect();
        if (endLocation) {
          const endX = endLocation.x;
          let endY = endLocation.y;

          // since the other player containers are css rotated, we need to modify the y
          // value so that the card is placed in the correct location
          if (squeakEndCoords) {
            const indexWithinSqueakStack =
              squeakEndCoords.squeakStack.findIndex(
                (card) => card.value === value && card.suit === suit
              );

            endY +=
              indexWithinSqueakStack === 0 ? 15 : indexWithinSqueakStack * 15;
          } else if (endID.includes("squeakHand")) {
            endY += 15; // should be modular
          }

          moveCard({ x: endX, y: endY }, false);

          setTimeout(() => {
            console.log("setting game data nyow");

            roomCtx.setGameData({
              ...roomCtx.gameData,
              board: updatedBoard || roomCtx.gameData?.board,
              players: updatedPlayerCards || roomCtx.gameData?.players,
            });

            if (ownerID !== userID && origin === "deck") {
              setCardOffsetPosition({ x: 0, y: 0 });
            } else {
              setCardHasBeenPlaced(true);
            }
          }, 10000);
        } else {
          console.log("end location not found"); // eventually delete this else part
        }
      }
    },
    [moveCard, ownerID, roomCtx, suit, value, userID, origin]
  );

  useEffect(() => {
    socket.on("cardDropApproved", (data) => handleApprovedCardDrop(data));
    socket.on("cardDropDenied", (data) => handleDeniedCardDrop(data));
    socket.on("cardDrawnFromSqueakDeck", (data) =>
      handleCardDrawnFromSqueakDeck(data)
    );
    socket.on("playerDrawnFromDeck", (data) => handleCardDrawnFromDeck(data));
  }, [
    handleApprovedCardDrop,
    handleDeniedCardDrop,
    handleCardDrawnFromSqueakDeck,
    handleCardDrawnFromDeck,
  ]);

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
      console.log("made it into squeak -> squeak drop handler");

      const idx = roomCtx.hoveredSqueakStack;

      const bottomSqueakStackCard =
        roomCtx.gameData?.players?.[userID!]?.squeakHand?.[idx]?.slice(-1)[0] ||
        null;

      console.log(
        "valid? ",
        cardPlacementIsValid(bottomSqueakStackCard, value, suit, false)
      );

      if (cardPlacementIsValid(bottomSqueakStackCard, value, suit, false)) {
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

    // if (origin === "deck") {
    //   roomCtx.setHoldingADeckCard(false);
    // } else if (origin === "squeak") {
    //   roomCtx.setHoldingASqueakCard(false);
    // }
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
      {(showCardBack || value || suit) && !cardHasBeenPlaced && (
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
          >
            <img
              className="pointer-events-none h-[64px] w-[48px] select-none lg:h-[72px] lg:w-[56px]"
              src={
                showCardBack && !manuallyShowCardFront
                  ? "/cards/BackRed.png"
                  : `/cards/${value}${suit}.svg`
              }
              alt={
                showCardBack && !manuallyShowCardFront
                  ? "Back of Card"
                  : `${value}${suit} Card`
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
