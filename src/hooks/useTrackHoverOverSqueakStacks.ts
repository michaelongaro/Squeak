import { useEffect } from "react";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";

function useTrackHoverOverSqueakStacks() {
  const userID = useUserIDContext();

  const { originIndexForHeldSqueakCard, setHoveredSqueakStack } =
    useRoomContext();

  useEffect(() => {
    // mousemove listener to check which squeak stack is being hovered over
    // excludes the squeak stack that the card is currently in

    function mouseHandler(e: MouseEvent) {
      if (userID === null) return;

      const squeakHand0 = document
        .getElementById(`${userID}squeakHand0`)
        ?.getBoundingClientRect();
      const squeakHand1 = document
        .getElementById(`${userID}squeakHand1`)
        ?.getBoundingClientRect();
      const squeakHand2 = document
        .getElementById(`${userID}squeakHand2`)
        ?.getBoundingClientRect();
      const squeakHand3 = document
        .getElementById(`${userID}squeakHand3`)
        ?.getBoundingClientRect();

      if (squeakHand0 && squeakHand1 && squeakHand2 && squeakHand3) {
        if (
          e.clientX > squeakHand0.left &&
          e.clientX < squeakHand0.right &&
          e.clientY > squeakHand0.top &&
          e.clientY < squeakHand0.bottom
        ) {
          setHoveredSqueakStack(0);
        } else if (
          e.clientX > squeakHand1.left &&
          e.clientX < squeakHand1.right &&
          e.clientY > squeakHand1.top &&
          e.clientY < squeakHand1.bottom
        ) {
          setHoveredSqueakStack(1);
        } else if (
          e.clientX > squeakHand2.left &&
          e.clientX < squeakHand2.right &&
          e.clientY > squeakHand2.top &&
          e.clientY < squeakHand2.bottom
        ) {
          setHoveredSqueakStack(2);
        } else if (
          e.clientX > squeakHand3.left &&
          e.clientX < squeakHand3.right &&
          e.clientY > squeakHand3.top &&
          e.clientY < squeakHand3.bottom
        ) {
          setHoveredSqueakStack(3);
        } else {
          setHoveredSqueakStack(null);
        }
      }
    }

    window.addEventListener("mousemove", mouseHandler);

    return () => {
      window.removeEventListener("mousemove", mouseHandler);
    };
  }, [originIndexForHeldSqueakCard, setHoveredSqueakStack, userID]);
}

export default useTrackHoverOverSqueakStacks;
