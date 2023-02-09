import { Fragment } from "react";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { AnimatePresence, motion } from "framer-motion";

interface IBoard {
  boardClass: string | undefined;
}

export interface IGetBoxShadowStyles {
  id: string;
  rowIdx?: number;
  colIdx?: number;
  squeakStackIdx?: number;
}

function Board({ boardClass }: IBoard) {
  const {
    gameData,
    holdingADeckCard,
    holdingASqueakCard,
    proposedCardBoxShadow,
    hoveredCell,
    setHoveredCell,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

  // interface to accept id, rowIdx, colIdx, squeakStackIdx

  function getBoxShadowStyles({
    id,
    rowIdx,
    colIdx,
  }: IGetBoxShadowStyles): string {
    if (holdingADeckCard || holdingASqueakCard) {
      return `0px 0px 10px ${
        hoveredCell?.[0] === rowIdx && hoveredCell?.[1] === colIdx
          ? "5px"
          : "3px"
      } rgba(184,184,184,1)`;
    } else if (proposedCardBoxShadow?.id === id) {
      return proposedCardBoxShadow.boxShadowValue;
    }

    return "none";
  }

  return (
    <div className={`${boardClass} grid w-full grid-cols-5 gap-1`}>
      {gameData?.board.map((row, rowIdx) => (
        <Fragment key={`boardRow${rowIdx}`}>
          {row.map((cell, colIdx) => (
            <div
              key={`board${rowIdx}${colIdx}`}
              id={`cell${rowIdx}${colIdx}`}
              style={{
                boxShadow: getBoxShadowStyles({
                  id: `cell${rowIdx}${colIdx}`,
                  rowIdx,
                  colIdx,
                }),
                opacity:
                  hoveredCell?.[0] === rowIdx &&
                  hoveredCell?.[1] === colIdx &&
                  (holdingADeckCard || holdingASqueakCard)
                    ? 0.35 // worst case you leave it like this (was prev 0.75)
                    : 1,
              }}
              className="baseFlex relative z-[600] h-[64px] min-h-fit w-[48px] min-w-fit rounded-lg p-1 transition-all tall:h-[90px] tall:w-[70px]"
              onMouseEnter={() => setHoveredCell([rowIdx, colIdx])}
              onMouseLeave={() => setHoveredCell(null)}
            >
              <AnimatePresence
                initial={false}
                mode={"wait"}
                onExitComplete={() => null}
              >
                {cell?.value && cell?.suit && (
                  <motion.div
                    key={`board${rowIdx}${colIdx}AnimatedCell`}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55 }}
                  >
                    <Card
                      value={cell?.value}
                      suit={cell?.suit}
                      showCardBack={false}
                      draggable={false}
                      rotation={0}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export default Board;
