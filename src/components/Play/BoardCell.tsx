import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { AnimatePresence, motion } from "framer-motion";
import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import { useEffect, useState } from "react";

interface IBoardCell {
  card: ICard | null;
  rowIdx: number;
  colIdx: number;
}

export interface IGetBoxShadowStyles {
  id: string;
  rowIdx?: number;
  colIdx?: number;
  squeakStackIdx?: number;
}

function BoardCell({ card, rowIdx, colIdx }: IBoardCell) {
  const { proposedCardBoxShadow } = useRoomContext();

  // I tried to make a framer motion <AnimatePresence> combo work here,
  // but would sometimes not animate out properly, so defaulting back to
  // regular css animations for now.
  const [shouldAnimatePlusOnePoint, setShouldAnimatePlusOnePoint] =
    useState(false);

  useEffect(() => {
    if (
      proposedCardBoxShadow?.id === `cell${rowIdx}${colIdx}` &&
      proposedCardBoxShadow?.boxShadowValue ===
        `0px 0px 4px 3px hsl(120, 100%, 86%)`
    ) {
      setShouldAnimatePlusOnePoint(true);

      setTimeout(() => {
        setShouldAnimatePlusOnePoint(false);
      }, 1000);
    }
  }, [proposedCardBoxShadow, rowIdx, colIdx]);

  return (
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

      {shouldAnimatePlusOnePoint && (
        <div
          className="animateFadeInOut absolute right-[-1.5rem] top-0 select-none text-lg tracking-wider tablet:right-[-1.85rem] desktop:text-2xl"
          key={`board${rowIdx}${colIdx}AnimatedPlusOneIndicator`}
        >
          +1
        </div>
      )}
    </AnimatePresence>
  );
}

export default BoardCell;
