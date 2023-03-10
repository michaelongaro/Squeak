import { Fragment } from "react";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { AnimatePresence, motion } from "framer-motion";
import useTrackHoverOverBoardCells from "../../hooks/useTrackHoverOverBoardCells";

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
  } = useRoomContext();

  useTrackHoverOverBoardCells();

  function getBoxShadowStyles({
    id,
    rowIdx,
    colIdx,
  }: IGetBoxShadowStyles): string {
    if (holdingADeckCard || holdingASqueakCard) {
      return `0px 0px 4px ${
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
    <div
      style={{
        outline: "4px ridge hsl(120deg 100% 86%)",
        boxShadow: "inset 0px 0px 16px 0px hsl(106deg 100% 5%)",
      }}
      className={`${boardClass} grid w-full select-none grid-cols-5 gap-1 rounded-md p-2`}
    >
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
                    ? 0.35
                    : 1,
              }}
              className="baseFlex relative z-0 h-[65px] min-h-fit w-[48px] min-w-fit select-none rounded-lg p-1 transition-all tall:h-[95px] tall:w-[70px]"
            >
              <AnimatePresence mode={"wait"}>
                {cell && (
                  <motion.div
                    key={`board${rowIdx}${colIdx}AnimatedCell`}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55 }}
                    className="relative h-full w-full select-none"
                  >
                    {cell.value !== "A" && cell.value !== "2" && (
                      <div className="absolute top-[2px] left-0 h-full w-full select-none">
                        <Card
                          showCardBack={true}
                          draggable={false}
                          rotation={0}
                        />
                      </div>
                    )}

                    {cell.value !== "A" && (
                      <div className="absolute top-[1px] left-0 h-full w-full select-none">
                        <Card
                          showCardBack={true}
                          draggable={false}
                          rotation={0}
                        />
                      </div>
                    )}

                    <Card
                      value={cell.value}
                      suit={cell.suit}
                      showCardBack={false}
                      draggable={false}
                      rotation={0}
                    />
                  </motion.div>
                )}

                <AnimatePresence mode={"wait"}>
                  {proposedCardBoxShadow?.id === `cell${rowIdx}${colIdx}` &&
                    proposedCardBoxShadow?.boxShadowValue ===
                      `0px 0px 4px 3px rgba(29, 232, 7, 1)` && (
                      <motion.div
                        key={`board${rowIdx}${colIdx}AnimatedPlusOneIndicator`}
                        initial={{ opacity: 0, scale: 0.9, translateY: 10 }}
                        animate={{ opacity: 1, scale: 1, translateY: 0 }}
                        exit={{ opacity: 0, scale: 0.9, translateY: -5 }}
                        transition={{ duration: 0.5 }}
                        style={{
                          color: "hsl(120deg 100% 86%)",
                        }}
                        className="absolute top-0 right-[-1.75rem] select-none text-xl tracking-wider"
                      >
                        +1
                      </motion.div>
                    )}
                </AnimatePresence>
              </AnimatePresence>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export default Board;
