import { useState, useEffect, Fragment } from "react";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { AnimatePresence, motion } from "framer-motion";
import useTrackHoverOverBoardCells from "../../hooks/useTrackHoverOverBoardCells";
import { type ICard } from "../../utils/generateDeckAndSqueakCards";

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

  const [lastCardWasAQueen, setLastCardWasAQueen] = useState(false);
  const [animatingOutDeck, setAnimatingOutDeck] = useState(false);

  useEffect(() => {
    if (card?.value === "Q") {
      setLastCardWasAQueen(true);
    }
  }, [card]);

  useEffect(() => {
    if (lastCardWasAQueen && card === null) {
      setAnimatingOutDeck(true);
      setTimeout(() => {
        setAnimatingOutDeck(false);
        setLastCardWasAQueen(false);
      }, 550);
    }
  }, [lastCardWasAQueen, card]);

  useTrackHoverOverBoardCells();

  return (
    <>
      {!animatingOutDeck && (
        <motion.div
          key={`board${rowIdx}${colIdx}AnimatedCell`}
          exit={{ opacity: 0, scale: 0.75 }}
          transition={{ duration: 0.55 }}
          className="relative h-full w-full select-none"
        >
          {card === null && lastCardWasAQueen && (
            <div className="absolute left-0 top-0 h-full w-full select-none">
              <Card
                showCardBack={true}
                draggable={false}
                hueRotation={0}
                rotation={0}
              />
            </div>
          )}

          {card && (
            <Card
              value={card.value}
              suit={card.suit}
              showCardBack={false}
              draggable={false}
              hueRotation={0}
              rotation={0}
            />
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {proposedCardBoxShadow?.id === `cell${rowIdx}${colIdx}` &&
          proposedCardBoxShadow?.boxShadowValue ===
            `0px 0px 4px 3px rgba(29, 232, 7, 1)` && (
            <motion.div
              key={`board${rowIdx}${colIdx}AnimatedPlusOneIndicator`}
              initial={{ opacity: 0, scale: 0.95, translateY: 10 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.95, translateY: -5 }}
              transition={{ duration: 0.5 }}
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="absolute right-[-1.85rem] top-0 select-none text-xl tracking-wider"
            >
              +1
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}

export default BoardCell;
