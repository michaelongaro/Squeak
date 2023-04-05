import { useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";

function useInitializeUserVolume() {
  const { setCurrentVolume } = useRoomContext();

  useEffect(() => {
    // setTimeout(() => {
    const storedVolume = localStorage.getItem("volume");

    if (storedVolume) {
      setCurrentVolume(parseFloat(storedVolume));
    }
    // }, 1500);
  }, []);
}

export default useInitializeUserVolume;
