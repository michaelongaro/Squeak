import Card from "./Card";
import { AnimatePresence, motion } from "framer-motion";
import { type ICard } from "../../utils/generateDeckAndSqueakCards";

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
        {plusOneIndicatorID === `cell${rowIdx}${colIdx}` && (
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
