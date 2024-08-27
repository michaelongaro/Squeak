import Card from "./Card";
import { AnimatePresence, motion } from "framer-motion";
import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface IBoardCell {
  card: ICard | null;
  rowIdx: number;
  colIdx: number;
  plusOneIndicatorID: string | null;
}

export interface IGetBoxShadowStyles {
  id: string;
  rowIdx?: number;
  colIdx?: number;
  squeakStackIdx?: number;
}

function BoardCell({ card, rowIdx, colIdx, plusOneIndicatorID }: IBoardCell) {
  const [absoluteTopLeftOffset, setAbsoluteTopLeftOffset] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  useEffect(() => {
    function handleResize() {
      const cell = document.getElementById(`cell${rowIdx}${colIdx}`);
      if (cell) {
        const { top, left, width: cardWidth } = cell.getBoundingClientRect();

        const leftOffsetFromCard =
          window.innerWidth >= 1500 && window.innerHeight >= 800 ? 10 : 6;

        setAbsoluteTopLeftOffset({
          x: left + cardWidth + leftOffsetFromCard,
          y: top,
        });
      }
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [rowIdx, colIdx]);

  return (
    <>
      <AnimatePresence>
        {card && (
          <motion.div
            key={`board${rowIdx}${colIdx}AnimatedCell`}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.55 }}
            className="relative h-full w-full select-none"
          >
            <Card
              value={card.value}
              suit={card.suit}
              showCardBack={false}
              draggable={false}
              hueRotation={0}
              rotation={0}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {plusOneIndicatorID === `cell${rowIdx}${colIdx}` && (
          <>
            {/* needed portal here to get around z-index issue by having this jsx render 
                on the body rather than within the z-0 constraints of the board cell. */}
            {createPortal(
              <motion.div
                key={`cell${rowIdx}${colIdx}AnimatedPlusOneIndicator`}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
                style={{
                  top: absoluteTopLeftOffset.y,
                  left: absoluteTopLeftOffset.x,
                }}
                className={`fixed z-[500] select-none text-lg tracking-wider text-lightGreen [text-shadow:_0_1px_3px_rgb(0_0_0)] desktop:text-xl`}
              >
                +1
              </motion.div>,
              document.body,
              `cell${rowIdx}${colIdx}AnimatedPlusOneIndicatorPortal`,
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default BoardCell;
