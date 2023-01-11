import { useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";

function useTrackHoverOverSqueakStacks() {
  const roomCtx = useRoomContext();
  useEffect(() => {
    // mousemove listener to check which squeak stack is being hovered over

    // TODO: refactor this with loops + logic rather than hardcoding
    function mouseHandler(e: MouseEvent) {
      const currUserSqueakHand0 = document.getElementById(
        "currUserSqueakHand0"
      );
      const currUserSqueakHand1 = document.getElementById(
        "currUserSqueakHand1"
      );
      const currUserSqueakHand2 = document.getElementById(
        "currUserSqueakHand2"
      );
      const currUserSqueakHand3 = document.getElementById(
        "currUserSqueakHand3"
      );
      if (roomCtx.originIndexForHeldSqueakCard === 0) {
        if (currUserSqueakHand1) {
          const rect = currUserSqueakHand1.getBoundingClientRect();

          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(1);
          }
        }

        if (currUserSqueakHand2) {
          const rect = currUserSqueakHand2.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(2);
          }
        }

        if (currUserSqueakHand3) {
          const rect = currUserSqueakHand3.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(3);
          }
        }
      } else if (roomCtx.originIndexForHeldSqueakCard === 1) {
        if (currUserSqueakHand0) {
          const rect = currUserSqueakHand0.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(0);
          }
        }

        if (currUserSqueakHand2) {
          const rect = currUserSqueakHand2.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(2);
          }
        }

        if (currUserSqueakHand3) {
          const rect = currUserSqueakHand3.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(3);
          }
        }
      } else if (roomCtx.originIndexForHeldSqueakCard === 2) {
        if (currUserSqueakHand0) {
          const rect = currUserSqueakHand0.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(0);
          }
        }

        if (currUserSqueakHand1) {
          const rect = currUserSqueakHand1.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(1);
          }
        }

        if (currUserSqueakHand3) {
          const rect = currUserSqueakHand3.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(3);
          }
        }
      } else if (roomCtx.originIndexForHeldSqueakCard === 3) {
        if (currUserSqueakHand0) {
          const rect = currUserSqueakHand0.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(0);
          }
        }

        if (currUserSqueakHand1) {
          const rect = currUserSqueakHand1.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(1);
          }
        }

        if (currUserSqueakHand2) {
          const rect = currUserSqueakHand2.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(2);
          }
        }
      } else if (roomCtx.holdingADeckCard) {
        if (currUserSqueakHand0) {
          const rect = currUserSqueakHand0.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(0);
          }
        }

        if (currUserSqueakHand1) {
          const rect = currUserSqueakHand1.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(1);
          }
        }

        if (currUserSqueakHand2) {
          const rect = currUserSqueakHand2.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(2);
          }
        }

        if (currUserSqueakHand3) {
          const rect = currUserSqueakHand3.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(3);
          }
        }
      }
    }

    window.addEventListener("mousemove", mouseHandler);

    return () => {
      window.removeEventListener("mousemove", mouseHandler);
    };
  }, [roomCtx]);
}

export default useTrackHoverOverSqueakStacks;
