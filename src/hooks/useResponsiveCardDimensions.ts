import { useState, useEffect } from "react";

function useResponsiveCardDimensions() {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    updateDimensions();

    function updateDimensions() {
      if (window.innerWidth < 1024 || window.innerHeight < 768) {
        setWidth(48);
        setHeight(64);
      } else {
        setWidth(67);
        setHeight(87);
      }
    }

    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return { width, height };
}

export default useResponsiveCardDimensions;
