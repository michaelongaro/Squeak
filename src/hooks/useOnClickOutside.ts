import { useEffect } from "react";

interface IOnClickOutside {
  ref: React.RefObject<HTMLDivElement>;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function useOnClickOutside({
  ref,
  setShowModal,
}: IOnClickOutside) {
  useEffect(() => {
    const clickListener = (event: MouseEvent) => {
      // Do nothing if clicking ref's element or descendent elements

      if (!ref.current?.contains(event.target as Node)) {
        setShowModal(false);
      }
    };

    const keydownListener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowModal(false);
      }
    };

    document.addEventListener("mousedown", clickListener);
    document.addEventListener("keydown", keydownListener);

    return () => {
      document.removeEventListener("mousedown", clickListener);
      document.removeEventListener("keydown", keydownListener);
    };
  }, []);
}
