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

  const [showPlusOneIndicator, setShowPlusOneIndicator] = useState(false);

  useEffect(() => {
    if (
      proposedCardBoxShadow !== null &&
      proposedCardBoxShadow.id === `cell${rowIdx}${colIdx}` &&
      proposedCardBoxShadow.boxShadowValue ===
        "0px 0px 4px 3px hsl(120, 100%, 86%)"
    ) {
      setShowPlusOneIndicator(true);

      setTimeout(() => {
        setShowPlusOneIndicator(false);
      }, 500); // trying to make sure the animation completes before hiding the indicator
      // this has been a recurring problem despite multiple approaches to fix it
    }

    return () => {
      setShowPlusOneIndicator(false);
    };
  }, [proposedCardBoxShadow, colIdx, rowIdx]);

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

      <AnimatePresence>
        {showPlusOneIndicator && (
          <motion.div
            key={`board${rowIdx}${colIdx}AnimatedPlusOneIndicator`}
            initial={{ opacity: 0, scale: 0.95, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.95, translateY: -5 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute right-[-1.5rem] top-0 select-none text-lg tracking-wider text-lightGreen tablet:right-[-1.85rem] desktop:text-xl"
          >
            +1
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

export default BoardCell;
