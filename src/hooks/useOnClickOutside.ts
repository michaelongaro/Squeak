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
    const listener = (event: MouseEvent) => {
      // Do nothing if clicking ref's element or descendent elements

      if (!ref.current?.contains(event.target as Node)) {
        setShowModal(false);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, []);
}
