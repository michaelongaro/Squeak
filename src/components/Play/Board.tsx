import { Fragment, useEffect, useState } from "react";
import { useRoomContext } from "../../context/RoomContext";
import useTrackHoverOverBoardCells from "../../hooks/useTrackHoverOverBoardCells";
import BoardCell from "./BoardCell";
import classes from "./Play.module.css";
import { motion, AnimatePresence } from "framer-motion";
export interface IGetBoxShadowStyles {
  id: string;
  rowIdx?: number;
  colIdx?: number;
  squeakStackIdx?: number;
}

function Board() {
  const {
    gameData,
    holdingADeckCard,
    holdingASqueakCard,
    proposedCardBoxShadow,
    hoveredCell,
    setProposedCardBoxShadow,
    deckVariantIndex,
  } = useRoomContext();

  useTrackHoverOverBoardCells();

  // FYI: I don't have a real way to explain why this is necessary, however the intent is that
  // both the plusOneIndicator and the cardDropApprovedBoxShadow should be reset to null shortly
  // after the card has been played. This was not happening after quick successive card placements
  // on the same deck cell. Below states and effect are a workaround to manually reset these states
  // after the card has been played. This is not ideal, but seemingly works okay.

  const [plusOneIndicatorID, setPlusOneIndicatorID] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (
      proposedCardBoxShadow !== null &&
      proposedCardBoxShadow.boxShadowValue ===
        "0px 0px 4px 3px hsl(120, 100%, 86%)"
    ) {
      setPlusOneIndicatorID(proposedCardBoxShadow.id);

      setTimeout(() => {
        setProposedCardBoxShadow(null);
      }, 300); // standard duration of box shadow transition

      setTimeout(() => {
        // if another card was played in quick succession *on the same cell*,
        // then leave the animation present, otherwise hide it
        if (proposedCardBoxShadow?.id === plusOneIndicatorID) {
          setPlusOneIndicatorID(null);
        }
      }, 900);
    }
  }, [proposedCardBoxShadow, plusOneIndicatorID, setProposedCardBoxShadow]);

  function getBoxShadowStyles({
    id,
    rowIdx,
    colIdx,
  }: IGetBoxShadowStyles): string {
    if (holdingADeckCard || holdingASqueakCard) {
      return `0px 0px 4px ${
        hoveredCell?.[0] === rowIdx && hoveredCell?.[1] === colIdx
          ? "4px"
          : "2px"
      } rgba(184,184,184,1)`;
    } else if (proposedCardBoxShadow?.id === id) {
      return proposedCardBoxShadow.boxShadowValue;
    }

    return "none";
  }

  return (
    <div
      id={"board"}
      style={{
        outline: "4px ridge hsl(120deg 100% 86%)",
        boxShadow: "inset 0px 0px 16px 0px hsl(106deg 100% 5%)",
      }}
      className={`${classes.board} grid w-full select-none grid-cols-5 gap-2 rounded-md bg-gradient-to-br from-green-800 to-green-850 p-2 mobileLarge:gap-4 desktop:gap-1`}
    >
      {gameData?.board.map((row, rowIdx) => (
        <Fragment key={`boardRow${rowIdx}`}>
          {row.map((cell, colIdx) => (
            <div
              key={`board${rowIdx}${colIdx}`}
              id={`parentCell${rowIdx}${colIdx}`}
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
              className="baseFlex z-0 h-[73px] min-h-fit w-[56px] min-w-fit select-none rounded-md p-1 transition-all mobileLarge:h-[78px] mobileLarge:w-[61px] tablet:h-[82px] tablet:w-[64px] desktop:h-[95px] desktop:w-[75px]"
            >
              <div
                id={`cell${rowIdx}${colIdx}`}
                className="relative h-full w-full"
              >
                <BoardCell
                  rowIdx={rowIdx}
                  colIdx={colIdx}
                  card={cell}
                  deckVariantIndex={deckVariantIndex}
                />

                {/* TODO: the start of this whole animation
                feels slightly delayed... maybe I am hallucinating this effect */}
                <AnimatePresence>
                  {plusOneIndicatorID === `cell${rowIdx}${colIdx}` && (
                    <motion.div
                      key={`cell${rowIdx}${colIdx}AnimatedPlusOneIndicator`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.75,
                        ease: "easeOut",
                      }}
                      className={`baseFlex absolute left-0 top-0 z-[500] h-full w-full select-none rounded-sm bg-darkGreen/50 text-lg tracking-wider text-lightGreen [text-shadow:_0_1px_3px_rgb(0_0_0)] desktop:text-xl`}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{
                          type: "spring",
                          damping: 4.5,
                          stiffness: 100,
                          delay: 0.25,
                        }}
                        className="baseFlex h-full w-full"
                      >
                        +1
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export default Board;
