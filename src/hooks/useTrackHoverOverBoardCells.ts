import { useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";

function useTrackHoverOverBoardCells() {
  const { setHoveredCell } = useRoomContext();

  useEffect(() => {
    // mousemove listener to check which squeak stack is being hovered over
    // excludes the squeak stack that the card is currently in

    function mouseHandler(e: MouseEvent) {
      let hoveredCell: [number, number] | null = null;

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
          const cell = document
            .getElementById(`cell${i}${j}`)
            ?.getBoundingClientRect();

          if (cell) {
            if (
              e.clientX > cell.left &&
              e.clientX < cell.right &&
              e.clientY > cell.top &&
              e.clientY < cell.bottom
            ) {
              hoveredCell = [i, j];
            }
          }
        }
      }

      setHoveredCell(hoveredCell);
    }

    window.addEventListener("mousemove", mouseHandler);

    return () => {
      window.removeEventListener("mousemove", mouseHandler);
    };
  }, [setHoveredCell]);
}

export default useTrackHoverOverBoardCells;
