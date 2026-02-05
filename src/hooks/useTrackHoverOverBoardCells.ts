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
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoveredCellRef = useRef<[number, number] | null>(hoveredCell);
  const holdingADeckCardRef = useRef(holdingADeckCard);
  const holdingASqueakCardRef = useRef(holdingASqueakCard);
  const boardCellBoundingRectsRef = useRef<IBoundingRect[]>(
    boardCellBoundingRects,
  );

  useEffect(() => {
    hoveredCellRef.current = hoveredCell;
  }, [hoveredCell]);

  useEffect(() => {
    holdingADeckCardRef.current = holdingADeckCard;
  }, [holdingADeckCard]);

  useEffect(() => {
    holdingASqueakCardRef.current = holdingASqueakCard;
  }, [holdingASqueakCard]);

  useEffect(() => {
    boardCellBoundingRectsRef.current = boardCellBoundingRects;
  }, [boardCellBoundingRects]);

  useEffect(() => {
    function resizeHandler() {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(() => {
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
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Throttled pointer move handler to reduce overhead
    const pointerMoveHandler = throttle((clientX: number, clientY: number) => {
      if (!holdingADeckCardRef.current && !holdingASqueakCardRef.current) {
        if (hoveredCellRef.current !== null) setHoveredCell(null);
        return;
      }

      let newHoveredCell: [number, number] | null = null;

      const rects = boardCellBoundingRectsRef.current;

      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];

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
      const currentHoveredCell = hoveredCellRef.current;

      if (
        (currentHoveredCell === null && newHoveredCell !== null) ||
        currentHoveredCell?.[0] !== newHoveredCell?.[0] ||
        currentHoveredCell?.[1] !== newHoveredCell?.[1]
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
  }, [setHoveredCell]);
}

export default useTrackHoverOverBoardCells;
