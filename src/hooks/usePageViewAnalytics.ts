import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { createPageViewTracker } from "~/utils/pageViewTracker";

export function usePageViewAnalytics() {
  const { isReady, asPath, events } = useRouter();
  const initialViewRecorded = useRef(false);
  const [trackPageView] = useState(() =>
    createPageViewTracker(() => {
      void fetch("/api/analytics/page-view", {
        method: "POST",
        keepalive: true,
      }).catch(() => {
        // Best effort: network failures should not affect navigation.
      });
    }),
  );

  useEffect(() => {
    if (!isReady || initialViewRecorded.current) return;
    initialViewRecorded.current = true;
    trackPageView(asPath);
  }, [isReady, asPath, trackPageView]);

  useEffect(() => {
    events.on("routeChangeComplete", trackPageView);
    return () => events.off("routeChangeComplete", trackPageView);
  }, [events, trackPageView]);
}
