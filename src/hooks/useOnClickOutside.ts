import { useEffect } from "react";

interface IOnClickOutside {
  ref: React.RefObject<HTMLDivElement>;
  setShowModal: (showSettingsModal: boolean) => void;
}

// TODO: eventually migrate this to shadcnui Dialog component..

export default function useOnClickOutside({
  ref,
  setShowModal,
}: IOnClickOutside) {
  useEffect(() => {
    const clickListener = (event: PointerEvent) => {
      const popoverElement = document.getElementById("popover");
      let popoverElementIsOpen = true;
      if (!popoverElement) popoverElementIsOpen = false;

      // If the popover is open and the click is inside the popover, do nothing
      if (
        popoverElementIsOpen &&
        popoverElement?.contains(event.target as Node)
      ) {
        return;
      }

      // If the click is outside the ref element, close the modal
      if (!ref.current?.contains(event.target as Node)) {
        setShowModal(false);
      }
    };

    const keydownListener = (event: KeyboardEvent) => {
      // @ts-expect-error - event.target is not always an element
      if (event.key === "Escape" && event.target?.tagName !== "INPUT") {
        setShowModal(false);
      }
    };

    document.addEventListener("pointerdown", clickListener);
    document.addEventListener("keydown", keydownListener);

    return () => {
      document.removeEventListener("pointerdown", clickListener);
      document.removeEventListener("keydown", keydownListener);
    };
  }, [ref, setShowModal]);
}
