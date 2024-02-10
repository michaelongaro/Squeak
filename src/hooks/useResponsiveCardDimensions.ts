import { useState, useEffect } from "react";

function useResponsiveCardDimensions() {
  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(65);

  useEffect(() => {
    function updateDimensions() {
      // large mobile dimensions
      if (window.innerHeight >= 667) {
        setWidth(54);
        setHeight(70);
      }

      // tablet dimensions
      if (
        window.innerWidth > 1000 &&
        window.innerWidth < 1500 &&
        window.innerHeight > 700 &&
        window.innerHeight < 800
      ) {
        setWidth(57);
        setHeight(74);
      }
      // desktop dimensions
      else if (window.innerWidth > 1500 && window.innerHeight > 800) {
        setWidth(67);
        setHeight(87);
      }
    }

    updateDimensions();

    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return { width, height };
}

export default useResponsiveCardDimensions;
