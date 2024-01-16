import { useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";

function useTrackHoverOverBoardCells() {
  const { holdingADeckCard, holdingASqueakCard, hoveredCell, setHoveredCell } =
    useRoomContext();

  useEffect(() => {
    // mousemove listener to check which squeak stack is being hovered over
    // excludes the squeak stack that the card is currently in

    function mouseHandler(e: MouseEvent) {
      if (!holdingADeckCard && !holdingASqueakCard) return;

      let newHoveredCell: [number, number] | null = null;

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
          const cell = document
            .getElementById(`parentCell${i}${j}`)
            ?.getBoundingClientRect();

          if (cell) {
            if (
              e.clientX > cell.left &&
              e.clientX < cell.right &&
              e.clientY > cell.top &&
              e.clientY < cell.bottom
            ) {
              newHoveredCell = [i, j];
            }
          }
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

    window.addEventListener("mousemove", mouseHandler);

    return () => {
      window.removeEventListener("mousemove", mouseHandler);
    };
  }, [hoveredCell, setHoveredCell, holdingADeckCard, holdingASqueakCard]);
}

export default useTrackHoverOverBoardCells;
