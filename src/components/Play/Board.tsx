import React from "react";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";

interface IBoard {
  boardClass: string | undefined;
}

function Board({ boardClass }: IBoard) {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

  // onMouseEnter/Leave -> set state in roomCtx for currentHoveredCell ([row, col] | null)
  // listen for .on("cardDropApproved") and update the board accordingly
  // ^^ will be receiving row,col value+suit userID that dropped it
  // ^^^^ will prob involve communication with <OtherPlayers /> since the card will be coming
  // from middle/squeakrow of their component. will involve some animation/rotation
  // general idea I think is still to

  console.log(
    roomCtx.gameData?.board.length,
    roomCtx.gameData?.board[0]?.length
  );

  return (
    <div
      style={{
        boxShadow: roomCtx.holdingACard
          ? `0px 0px 10px "3px"
                    } rgba(184,184,184,1)`
          : "none",
      }}
      className={`${boardClass} grid w-full grid-cols-5 gap-1`}
    >
      {roomCtx.gameData?.board.map((row, rowIdx) => (
        <>
          {row.map((cell, colIdx) => (
            <div
              key={`${userID}board${rowIdx}${colIdx}`}
              style={{
                boxShadow: roomCtx.holdingACard
                  ? `0px 0px 10px ${
                      roomCtx.hoveredCell?.[0] === rowIdx &&
                      roomCtx.hoveredCell?.[1] === colIdx
                        ? "5px"
                        : "3px"
                    } rgba(184,184,184,1)`
                  : "none",
                opacity:
                  roomCtx.hoveredCell?.[0] === rowIdx &&
                  roomCtx.hoveredCell?.[1] === colIdx &&
                  roomCtx.holdingACard
                    ? 0.35 // worst case you leave it like this (was prev 0.75)
                    : 1,
              }}
              className="baseFlex relative z-[600] h-16 min-h-fit w-12 min-w-fit rounded-lg p-4 transition-all"
              onMouseEnter={() => roomCtx.setHoveredCell([rowIdx, colIdx])}
              onMouseLeave={() => roomCtx.setHoveredCell(null)}
            >
              <Card
                value={cell?.value}
                suit={cell?.suit}
                showCardBack={false}
                draggable={false}
              />
            </div>
          ))}
        </>
      ))}
    </div>
  );
}

export default Board;
