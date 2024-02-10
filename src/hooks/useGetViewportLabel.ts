import { useEffect, useLayoutEffect, useState } from "react";

function useGetViewportLabel() {
  const [viewportLabel, setViewportLabel] = useState<
    "mobile" | "mobileLarge" | "tablet" | "desktop"
  >("mobile");

  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    function handleResize() {
      let viewportLabel: "mobile" | "mobileLarge" | "tablet" | "desktop" =
        "mobile";

      // TODO: experiment with this
      if (window.innerHeight > 667) {
        viewportLabel = "mobileLarge";
      }

      if (window.innerWidth > 1000 && window.innerHeight > 700) {
        viewportLabel = "tablet";
      }

      if (window.innerWidth > 1500 && window.innerHeight > 800) {
        viewportLabel = "desktop";
      }

      setViewportLabel(viewportLabel);
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewportLabel;
}

export default useGetViewportLabel;
