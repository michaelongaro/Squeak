import { useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { UserIDProvider } from "../context/UserIDContext";
import type { AppProps } from "next/app";
import { RoomProvider } from "../context/RoomContext";
import NextProgress from "next-progress";
import { api } from "~/utils/api";
import { io } from "socket.io-client";
import GeneralLayout from "~/components/layout/GeneralLayout";
import dynamic from "next/dynamic";
import "../styles/globals.css";

const UnsupportedBrowserDetected = dynamic(
  () => import("~/components/UnsupportedBrowserDetected"),
);

export const socket = io({
  path: "/api/socket",
});

// might in some way mess with t3 bootstrapping, be wary
type ComponentWithPageLayout = AppProps & {
  Component: AppProps["Component"] & {
    PageLayout?: React.ComponentType;
  };
};

function App({ Component, pageProps }: ComponentWithPageLayout) {
  // used only as a fallback since Clerk auth requires lookbehind support
  // and older, but still used Safari versions don't support it.
  const [lookbackBehindIsSupported, setLookBehindIsSupported] = useState(true);

  useEffect(() => {
    const supported = checkLookBehindSupport();
    setLookBehindIsSupported(supported);
  }, []);

  // against accessibility, however accidental zooming on mobile was a potential problem, and reverting
  // screen to regular zoom level seemed to cause <OtherPlayerCardContainers /> to be rendered incorrectly
  useEffect(() => {
    function handleGestureStartAndChange(e: Event) {
      e.preventDefault();
      document.body.style.zoom = "0.99";
    }

    function handleGestureEnd(e: Event) {
      e.preventDefault();
      document.body.style.zoom = "1";
    }

    document.addEventListener("gesturestart", handleGestureStartAndChange);
    document.addEventListener("gesturechange", handleGestureStartAndChange);
    document.addEventListener("gestureend", handleGestureEnd);

    return () => {
      document.removeEventListener("gesturestart", handleGestureStartAndChange);
      document.removeEventListener(
        "gesturechange",
        handleGestureStartAndChange,
      );
      document.removeEventListener("gestureend", handleGestureEnd);
    };
  });

  if (!lookbackBehindIsSupported) {
    return <UnsupportedBrowserDetected />;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: "rgb(0, 92, 0)",
          colorInputBackground: "#f5f5f4",
          colorTextSecondary: "rgb(0, 41, 0)",
          fontFamily: "'Montserrat', sans-serif",
          borderRadius: "0.375rem",
          colorDanger: "rgb(220, 38, 38)",
          colorSuccess: "rgb(0, 92, 0)",
          colorInputText: "rgb(0, 71, 0)",
          colorBackground: "#f5f5f4",
          colorText: "rgb(0, 71, 0)",
        },
      }}
      {...pageProps}
    >
      <NextProgress
        color={"rgb(184, 255, 184)"}
        height={4}
        delay={300}
        disableSameRoute
        options={{ showSpinner: false }}
      />

      <UserIDProvider>
        <RoomProvider>
          <GeneralLayout>
            <Component {...pageProps} />
          </GeneralLayout>
        </RoomProvider>
      </UserIDProvider>
    </ClerkProvider>
  );
}

export default api.withTRPC(App);

function checkLookBehindSupport() {
  try {
    new RegExp("(?<=)");
    return true;
  } catch (err) {
    return false;
  }
}
