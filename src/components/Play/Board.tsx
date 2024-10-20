import { Fragment, useEffect, useState } from "react";
import { useRoomContext } from "../../context/RoomContext";
import useTrackHoverOverBoardCells from "../../hooks/useTrackHoverOverBoardCells";
import BoardCell from "./BoardCell";
import classes from "./Play.module.css";

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
    deckVariantIndex,
    plusOneIndicatorID,
    setPlusOneIndicatorID,
  } = useRoomContext();

  const [prevPlusOneIndicatorID, setPrevPlusOneIndicatorID] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (plusOneIndicatorID === null) return;

    const plusOneIndicatorBackground = document.getElementById(
      `${plusOneIndicatorID}PlusOneBackground`,
    );
    const plusOneIndicator = document.getElementById(
      `${plusOneIndicatorID}PlusOne`,
    );

    if (plusOneIndicatorBackground && plusOneIndicator) {
      // clear existing plusOneIndicator (if any) before showing the new ones,
      // otherwise the previous animation would just finish out it's duration
      // and not show the new one.
      if (prevPlusOneIndicatorID === plusOneIndicatorID) {
        plusOneIndicatorBackground.classList.remove("plusOneBackground");
        plusOneIndicator.classList.remove("springPlusOne");
        setTimeout(() => {
          plusOneIndicatorBackground.classList.add("plusOneBackground");
          plusOneIndicator.classList.add("springPlusOne");
        }, 150); // trying to allow the browser to clear the classes before adding them back.
        // not the biggest fan of this approach though, requestAnimationFrame didn't seem to work
      } else {
        plusOneIndicatorBackground.classList.add("plusOneBackground");
        plusOneIndicator.classList.add("springPlusOne");
      }
    }

    setPrevPlusOneIndicatorID(plusOneIndicatorID);
  }, [plusOneIndicatorID, prevPlusOneIndicatorID]);

  useTrackHoverOverBoardCells();

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
                  setPlusOneIndicatorID={setPlusOneIndicatorID}
                />
              </div>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export default Board;
