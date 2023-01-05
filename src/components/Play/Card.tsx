import { useEffect } from "react";
import Image from "next/image";
import React from "react";
import Draggable from "react-draggable";
import { useRoomContext } from "../../context/RoomContext";
import cardPlacementIsValid from "../../utils/cardPlacementIsValid";

interface ICard {
  value?: string;
  suit?: string;
  showCardBack?: boolean;
  draggable: boolean;
}

function Card({ value, suit, showCardBack, draggable }: ICard) {
  const roomCtx = useRoomContext();
  // play around with "bounds" prop, maybe add #board id to board, how to also allow within
  // player space though..

  // onDrop, should set a state in roomCtx once it passes both front+backend validation,
  // something like "cardDropped", where the <Board /> component can listen for that state
  // and change the board accordingly, and this component will be listening for the .on("cardDropApproved")
  // or something to then update the card here

  // const [mouseDown, setMouseDown] = React.useState(false);

  return (
    <>
      {value && suit && (
        <Draggable
          disabled={!draggable}
          onStop={() => {
            console.log(
              "dropped with :",
              value,
              suit,
              roomCtx.hoveredCell,
              roomCtx.holdingACard
            );

            if (roomCtx.holdingACard && roomCtx.hoveredCell && value && suit) {
              // check to see if the card placement is valid

              const [row, col] = roomCtx.hoveredCell;

              // @ts-expect-error asdf
              const boardCell = roomCtx.gameData?.board[row][col];

              console.log(
                "valid? : ",
                // @ts-expect-error asdf
                cardPlacementIsValid(boardCell, value, suit)
              );

              // @ts-expect-error asdf
              if (cardPlacementIsValid(boardCell, value, suit)) {
                console.log("card dropped", row, col, value, suit);
                // emit to backend
              }
            }
          }}
        >
          <div className="relative z-[500] h-auto w-auto cursor-grab focus:cursor-grabbing">
            <Image
              src={require(`../../../public/cards/${value}${suit}.svg`)}
              alt={`${value}${suit} Card`}
              width={48} //window.innerWidth * 0.2
              height={64}
              draggable="false"
              onMouseDown={() => {
                console.log("card grabbed");

                // setMouseDown(true);
                roomCtx.setHoldingACard(true);
              }}
              onMouseUp={() => {
                console.log("card left");

                // setMouseDown(false);
                roomCtx.setHoldingACard(false);
              }}
            />
          </div>
        </Draggable>
      )}

      {showCardBack && (
        <div className="relative z-[-500] h-auto w-auto">
          <Image
            src={require(`../../../public/cards/BackRed.png`)}
            alt={"Back of Card"}
            width={48} //window.innerWidth * 0.2
            height={64}
            draggable="false"
            // z-index={-1}
          />
        </div>
      )}
    </>
  );
}

export default Card;
