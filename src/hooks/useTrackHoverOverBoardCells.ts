import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";

interface IBoundingRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cellCoords: [number, number];
}

function useTrackHoverOverBoardCells() {
  const { holdingADeckCard, holdingASqueakCard, hoveredCell, setHoveredCell } =
    useRoomContext();

  const [boardCellBoundingRects, setBoardCellBoundingRects] = useState<
    IBoundingRect[]
  >([]);

  useEffect(() => {
    function resizeHandler() {
      setTimeout(() => {
        const newBoardCellBoundingRects: IBoundingRect[] = [];

        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 5; j++) {
            const cell = document
              .getElementById(`parentCell${i}${j}`)
              ?.getBoundingClientRect();

            if (cell) {
              newBoardCellBoundingRects.push({
                left: cell.left,
                right: cell.right,
                top: cell.top,
                bottom: cell.bottom,
                cellCoords: [i, j],
              });
            }
          }
        }

        setBoardCellBoundingRects(newBoardCellBoundingRects);
      }, 1500); // hacky, but waiting for the board to be fully resized/painted
      // before updating the bounding rects
    }

    resizeHandler();

    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  useEffect(() => {
    // listener to check which squeak stack is being hovered over
    // excludes the squeak stack that the card is currently in
    function pointerMoveHandler(clientX: number, clientY: number) {
      if (!holdingADeckCard && !holdingASqueakCard) {
        if (hoveredCell !== null) setHoveredCell(null);
        return;
      }

      let newHoveredCell: [number, number] | null = null;

      for (let i = 0; i < boardCellBoundingRects.length; i++) {
        const rect = boardCellBoundingRects[i];

        if (
          rect &&
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          newHoveredCell = rect.cellCoords;
          break;
        }
      }

      // only update hoveredCell if it has changed
      if (
        (hoveredCell === null && newHoveredCell !== null) ||
        hoveredCell?.[0] !== newHoveredCell?.[0] ||
        hoveredCell?.[1] !== newHoveredCell?.[1]
      ) {
        setHoveredCell(newHoveredCell);
      }
    }

    // Mouse move handler
    function mouseMoveHandler(e: MouseEvent) {
      pointerMoveHandler(e.clientX, e.clientY);
    }

    // Touch move handler
    function touchMoveHandler(e: TouchEvent) {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        if (!touch) return;
        pointerMoveHandler(touch.clientX, touch.clientY);
      }
    }

    window.addEventListener("mousemove", mouseMoveHandler);
    window.addEventListener("touchmove", touchMoveHandler);

    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
      window.removeEventListener("touchmove", touchMoveHandler);
    };
  }, [
    boardCellBoundingRects,
    hoveredCell,
    setHoveredCell,
    holdingADeckCard,
    holdingASqueakCard,
  ]);
}

export default useTrackHoverOverBoardCells;
