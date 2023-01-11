import { useState, useEffect, useRef } from "react";
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
import { type ICardDropProposal } from "../../pages/api/socket";

interface ICard {
  value?: string;
  suit?: string;
  showCardBack?: boolean;
  draggable: boolean;
  origin?: "deck" | "squeak";
}

function Card({ value, suit, showCardBack, draggable, origin }: ICard) {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

  const [cardOffsetPosition, setCardOffsetPosition] = useState({ x: 0, y: 0 });
  const [cardHasBeenPlaced, setCardHasBeenPlaced] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("cardDropApproved", (data) => handleApprovedCardDrop(data));
    socket.on("cardDropDenied", (data) => handleDeniedCardDrop(data));
  }, []);

  function handleDeniedCardDrop({ playerID }: Partial<ICardDropProposal>) {
    if (playerID === userID) {
      moveCardBackToOriginalPosition();
    }
  }

  function handleApprovedCardDrop({
    card,
    deckStart, // necessary for THIS component? I know in <OtherPlayers />
    squeakStartLocation, // necessary for THIS component? I know in <OtherPlayers />
    boardEndLocation,
    squeakEndLocation,
    updatedBoard,
    updatedPlayerCards,
    playerID,
  }: Partial<ICardDropProposal>) {
    // this verifies that the card played was played by current user

    // for ALL you need a TEENY animation like idk 50ms or something?
    // to move card to right location, THEN update context

    // need to delete card from deck whenever coming from deck? seems necessary

    roomCtx.setGameData({
      ...roomCtx.gameData,
      board: updatedBoard || roomCtx.gameData?.board,
      players: updatedPlayerCards || roomCtx.gameData?.players,
    });

    if (
      card &&
      playerID === userID &&
      card.value === value &&
      card.suit === suit
    ) {
      console.log("card drop approved");

      // not sure if you want to keep this here, but def shouldn't be in this if statement
      // because it won't be called if other player drops their card
      // roomCtx.setGameData({
      //   ...roomCtx.gameData,
      //   board: updatedBoard || roomCtx.gameData?.board,
      //   players: updatedPlayerCards || roomCtx.gameData?.players,
      // });

      // below is NOT necessary right?
      // if (deckStart && boardEndLocation) {
      //   roomCtx.setGameData({
      //     ...roomCtx.gameData,
      //     board: updatedBoard
      //   });
      // } else if (deckStart && squeakEndLocation && roomCtx.gameData) {
      //   roomCtx.setGameData({
      //     ...roomCtx.gameData,
      //     players: updatedPlayerCards!
      //   });
      // } else if (squeakStartLocation && boardEndLocation) {
      //   roomCtx.setGameData({
      //     ...roomCtx.gameData,
      //     players: updatedPlayerCards!,
      //   });
      // } else if (squeakStartLocation && squeakEndLocation) {
      //   roomCtx.setGameData({
      //     ...roomCtx.gameData,
      //     players: updatedPlayerCards!,
      //   });
      // }

      if (origin === "deck") {
        roomCtx.setHoldingADeckCard(false);
      } else if (origin === "squeak") {
        roomCtx.setHoldingASqueakCard(false);
      }

      setCardHasBeenPlaced(true);
    }
  }

  function dropHandler() {
    console.log(
      "dropHandler called with",
      "holdingSqueak? :",
      roomCtx.holdingASqueakCard,
      "hoveredSqueak? :",
      roomCtx.hoveredSqueakStack,
      "originSqueak? :",
      roomCtx.originIndexForHeldSqueakCard,
      "boardLocation? :",
      roomCtx.hoveredCell
    );

    // deck start + board end
    if (roomCtx.holdingADeckCard && roomCtx.hoveredCell && value && suit) {
      const [row, col] = roomCtx.hoveredCell;

      const boardCell = roomCtx.gameData?.board?.[row]?.[col] || null;

      console.log("dropping THIS card:", value, suit);

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
        moveCardBackToOriginalPosition();
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
        moveCardBackToOriginalPosition();
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
        moveCardBackToOriginalPosition();
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

      const bottomSqueakStackCard =
        roomCtx.gameData?.players?.[userID!]?.squeakHand?.[idx]?.slice(-1)[0] ||
        null;

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
        moveCardBackToOriginalPosition();
      }
    }

    // dropping card over anywhere else
    else {
      moveCardBackToOriginalPosition();
    }
  }

  function dragHandler(e: DraggableEvent, data: DraggableData) {
    const { x, y } = cardOffsetPosition;
    setCardOffsetPosition({
      x: x + data.deltaX,
      y: y + data.deltaY,
    });
  }

  function moveCardBackToOriginalPosition() {
    if (cardRef.current) {
      cardRef.current.style.transition = "all 0.35s ease-in-out";
      setCardOffsetPosition({ x: 0, y: 0 });
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = "none";
        }
      }, 350);
      if (origin === "deck") {
        roomCtx.setHoldingADeckCard(false);
      } else if (origin === "squeak") {
        roomCtx.setHoldingASqueakCard(false);
      }
    }
  }

  // if card is draggable or the deck, on hover should show the same whiteish box shadow

  return (
    <>
      {value && suit && !cardHasBeenPlaced && (
        <Draggable
          disabled={!draggable}
          onDrag={(e, data) => dragHandler(e, data)}
          position={cardOffsetPosition}
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
              src={`/cards/${value}${suit}.svg`}
              alt={`${value}${suit} Card`}
              draggable="false"
            />
          </div>
        </Draggable>
      )}

      {showCardBack && (
        <img
          className="h-[64px] w-[48px] select-none rounded-md lg:h-[72px] lg:w-[56px]"
          src={`/cards/BackRed.png`}
          alt={"Back of Card"}
          draggable="false"
        />
      )}
    </>
  );
}

export default Card;
