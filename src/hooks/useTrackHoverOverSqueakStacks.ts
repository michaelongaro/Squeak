import { useEffect } from "react";
import { useLocalStorageContext } from "../context/LocalStorageContext";
import { useRoomContext } from "../context/RoomContext";

function useTrackHoverOverSqueakStacks() {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();
  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

  useEffect(() => {
    // mousemove listener to check which squeak stack is being hovered over

    // TODO: refactor this with loops + logic rather than hardcoding
    function mouseHandler(e: MouseEvent) {
      if (userID === null) return;

      const squeakHand0 = document.getElementById(`${userID}squeakHand0`);
      const squeakHand1 = document.getElementById(`${userID}squeakHand1`);
      const squeakHand2 = document.getElementById(`${userID}squeakHand2`);
      const squeakHand3 = document.getElementById(`${userID}squeakHand3`);

      if (roomCtx.originIndexForHeldSqueakCard === 0) {
        if (squeakHand1) {
          const rect = squeakHand1.getBoundingClientRect();

          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(1);
          }
        }

        if (squeakHand2) {
          const rect = squeakHand2.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(2);
          }
        }

        if (squeakHand3) {
          const rect = squeakHand3.getBoundingClientRect();
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
        if (squeakHand0) {
          const rect = squeakHand0.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(0);
          }
        }

        if (squeakHand2) {
          const rect = squeakHand2.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(2);
          }
        }

        if (squeakHand3) {
          const rect = squeakHand3.getBoundingClientRect();
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
        if (squeakHand0) {
          const rect = squeakHand0.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(0);
          }
        }

        if (squeakHand1) {
          const rect = squeakHand1.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(1);
          }
        }

        if (squeakHand3) {
          const rect = squeakHand3.getBoundingClientRect();
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
        if (squeakHand0) {
          const rect = squeakHand0.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(0);
          }
        }

        if (squeakHand1) {
          const rect = squeakHand1.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(1);
          }
        }

        if (squeakHand2) {
          const rect = squeakHand2.getBoundingClientRect();
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
        if (squeakHand0) {
          const rect = squeakHand0.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(0);
          }
        }

        if (squeakHand1) {
          const rect = squeakHand1.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(1);
          }
        }

        if (squeakHand2) {
          const rect = squeakHand2.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            roomCtx.setHoveredSqueakStack(2);
          }
        }

        if (squeakHand3) {
          const rect = squeakHand3.getBoundingClientRect();
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
  }, [roomCtx, userID]);
}

export default useTrackHoverOverSqueakStacks;
