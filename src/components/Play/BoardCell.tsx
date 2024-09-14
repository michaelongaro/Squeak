import { AnimatePresence, motion } from "framer-motion";
import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import StaticCard from "~/components/Play/StaticCard";

export interface IGetBoxShadowStyles {
  id: string;
  rowIdx?: number;
  colIdx?: number;
  squeakStackIdx?: number;
}

interface IBoardCell {
  card: ICard | null;
  rowIdx: number;
  colIdx: number;
  deckVariantIndex: number;
}

function BoardCell({ card, rowIdx, colIdx, deckVariantIndex }: IBoardCell) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key={`board${rowIdx}${colIdx}AnimatedCell`}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.55 }}
          className="relative h-full w-full select-none"
        >
          <StaticCard
            suit={card.suit}
            value={card.value}
            deckVariantIndex={deckVariantIndex}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BoardCell;
