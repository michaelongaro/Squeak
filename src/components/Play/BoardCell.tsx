import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import StaticCard from "~/components/Play/StaticCard";

interface IBoardCell {
  card: ICard | null;
  rowIdx: number;
  colIdx: number;
  deckVariantIndex: number;
}

function BoardCell({ card, rowIdx, colIdx, deckVariantIndex }: IBoardCell) {
  const plusOneBackgroundRef = useRef<HTMLDivElement | null>(null);
  const plusOneRef = useRef<HTMLDivElement | null>(null);

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

      <div
        ref={plusOneBackgroundRef}
        id={`cell${rowIdx}${colIdx}PlusOneBackground`}
        onAnimationEnd={() => {
          if (plusOneBackgroundRef.current && plusOneRef.current) {
            plusOneBackgroundRef.current.classList.remove(
              "plusOneBackground",
              "kingScaleDown",
            );
            plusOneRef.current.classList.remove("springPlusOne");
          }
        }}
        className={`baseFlex absolute left-0 top-0 z-[500] h-full w-full select-none rounded-sm bg-darkGreen/50 text-xl tracking-wider text-lightGreen opacity-0 [text-shadow:_0_1px_3px_rgb(0_0_0)] desktop:text-[26px]`}
      >
        <div
          ref={plusOneRef}
          id={`cell${rowIdx}${colIdx}PlusOne`}
          className={`baseFlex h-full w-full select-none opacity-0`}
        >
          +1
        </div>
      </div>
    </AnimatePresence>
  );
}

export default BoardCell;
