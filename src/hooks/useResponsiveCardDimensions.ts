import { useState, useEffect } from "react";

function useResponsiveCardDimensions() {
  const [width, setWidth] = useState<string>("0px");
  const [height, setHeight] = useState<string>("0px");

  useEffect(() => {
    updateDimensions();

    function updateDimensions() {
      if (window.innerWidth < 1024 || window.innerHeight < 768) {
        setWidth("48px");
        setHeight("64px");
      } else {
        setWidth("67px");
        setHeight("87px");
      }
    }

    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return { width, height };
}

export default useResponsiveCardDimensions;
