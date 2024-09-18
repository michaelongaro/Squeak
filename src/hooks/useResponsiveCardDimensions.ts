import { useState, useEffect } from "react";

function useResponsiveCardDimensions() {
  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(65);

  useEffect(() => {
    function updateDimensions() {
      let width = 50;
      let height = 65;

      // large mobile dimensions
      if (window.innerHeight >= 667) {
        width = 54;
        height = 70;
      }

      // tablet dimensions
      if (
        window.innerWidth >= 1000 &&
        window.innerWidth < 1500 &&
        window.innerHeight >= 700 &&
        window.innerHeight < 800
      ) {
        width = 57;
        height = 74;
      }
      // desktop dimensions
      else if (window.innerWidth >= 1500 && window.innerHeight >= 800) {
        width = 67;
        height = 87;
      }

      setWidth(width);
      setHeight(height);
    }

    updateDimensions();

    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return { width, height };
}

export default useResponsiveCardDimensions;
