import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";

function useInitializeLocalStorageValues() {
  const { setCurrentVolume, setPrefersSimpleCardAssets } = useRoomContext();

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    setInitialized(true);

    const storedVolume = localStorage.getItem("squeakVolume");
    const prefersSimpleCardAssets = localStorage.getItem(
      "squeakPrefersSimpleCardAssets"
    );

    if (storedVolume) {
      setCurrentVolume(parseFloat(storedVolume));
    } else {
      localStorage.setItem("squeakVolume", "50");
      setCurrentVolume(50);
    }

    if (prefersSimpleCardAssets) {
      setPrefersSimpleCardAssets(
        prefersSimpleCardAssets === "true" ? true : false
      );
    } else {
      localStorage.setItem("squeakPrefersSimpleCardAssets", "false");
      setPrefersSimpleCardAssets(false);
    }
  }, [initialized, setCurrentVolume, setPrefersSimpleCardAssets]);
}

export default useInitializeLocalStorageValues;
