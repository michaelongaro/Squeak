import { useState, useEffect, useRef } from "react";
import { useRoomContext } from "../context/RoomContext";

interface IBoundingRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cellCoords: [number, number];
}

function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastRan = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRan >= delay) {
      func(...args);
      lastRan = now;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          func(...args);
          lastRan = Date.now();
        },
        delay - (now - lastRan),
      );
    }
  }) as T;
}

function useTrackHoverOverBoardCells() {
  const { holdingADeckCard, holdingASqueakCard, hoveredCell, setHoveredCell } =
    useRoomContext();

  const [boardCellBoundingRects, setBoardCellBoundingRects] = useState<
    IBoundingRect[]
  >([]);
  const rafIdRef = useRef<number>(0);

  useEffect(() => {
    function resizeHandler() {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
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
        }, 100);
      });
    }

    resizeHandler();

    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Throttled pointer move handler to reduce overhead
    const pointerMoveHandler = throttle((clientX: number, clientY: number) => {
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
    }, 16); // ~60fps throttling

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
    window.addEventListener("touchmove", touchMoveHandler, { passive: true });

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
