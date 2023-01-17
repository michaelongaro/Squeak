import { useRef, useEffect, useState } from "react";
import { socket } from "../../pages";
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

  // useEffect(() => {
  //   socket.on("cardDropApproved", (data) => {
  //     // hide the card (maybe directly mutate the value + suit to undefined? not sure of
  //     // implications with that)

  //     console.log("board got updated");

  //     roomCtx.setGameData({
  //       ...roomCtx.gameData,
  //       board: data.updatedBoard,
  //     });
  //   });
  // }, []);

  // might need to add roomCtx to deps here

  // just have unique IDs for each cell,
  // in board it would be #rowcol and then you can `#${row}${col}` to access
  // for players prob do like `#${playerID}num` num would be 0-7 or whatever

  return (
    <div className={`${boardClass} grid w-full grid-cols-5 gap-1`}>
      {roomCtx.gameData?.board.map((row, rowIdx) => (
        <>
          {row.map((cell, colIdx) => (
            <div
              id={`cell${rowIdx}${colIdx}`}
              key={`${userID}board${rowIdx}${colIdx}`}
              style={{
                boxShadow:
                  roomCtx.holdingADeckCard || roomCtx.holdingASqueakCard
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
                  (roomCtx.holdingADeckCard || roomCtx.holdingASqueakCard)
                    ? 0.35 // worst case you leave it like this (was prev 0.75)
                    : 1,
              }}
              className="baseFlex relative z-[600] h-[80px] min-h-fit w-[60px] min-w-fit rounded-lg p-1 transition-all"
              onMouseEnter={() => roomCtx.setHoveredCell([rowIdx, colIdx])}
              onMouseLeave={() => roomCtx.setHoveredCell(null)}
            >
              <Card
                value={cell?.value}
                suit={cell?.suit}
                showCardBack={false}
                draggable={false}
                animationConfig={{
                  // TODO: remove needing this for Board cards
                  xMultiplier: 1,
                  yMultiplier: 1,
                  rotation: 0,
                }}
              />
            </div>
          ))}
        </>
      ))}
    </div>
  );
}

export default Board;
