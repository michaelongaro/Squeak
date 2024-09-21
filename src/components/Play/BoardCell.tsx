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
  plusOneIndicatorID: string | null;
}

function BoardCell({
  card,
  rowIdx,
  colIdx,
  deckVariantIndex,
  plusOneIndicatorID,
}: IBoardCell) {
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BoardCell;
