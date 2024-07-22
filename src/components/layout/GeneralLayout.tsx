import { AnimatePresence } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { Montserrat } from "next/font/google";
import { Toaster, ToastBar } from "react-hot-toast";
import TopRightControls from "../TopRightControls/TopRightControls";
import { cardAssets } from "~/utils/cardAssetPaths";
import useInitializeLocalStorageValues from "~/hooks/useInitializeLocalStorageValues";
import usePlayerLeftRoom from "~/hooks/usePlayerLeftRoom";
import useAttachUnloadEventListener from "~/hooks/useAttachUnloadEventListener";
import useRejoinRoom from "~/hooks/useRejoinRoom";
import Head from "next/head";
import { useRouter } from "next/router";

const montserrat = Montserrat({
  weight: "variable",
  subsets: ["latin"],
});

function isIOS() {
  // @ts-expect-error - TS currently doesn't know about the MSStream global
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

interface GeneralLayout {
  children: ReactNode;
}

function GeneralLayout({ children }: GeneralLayout) {
  const { asPath } = useRouter();

  // prevents iOS overscrolling on the /game page for better UX while playing
  useEffect(() => {
    if (asPath.includes("game") && isIOS()) {
      document.documentElement.style.overscrollBehavior = "none";
      document.body.style.overflowY = "scroll";
    } else {
      document.documentElement.style.overscrollBehavior = "auto";
      document.body.style.overflowY = "auto";
    }
  }, [asPath]);

  useEffect(() => {
    // prefetching/caching card assets to prevent any flickering of the assets
    // the very first time a player plays a round
    setTimeout(() => {
      for (const imagePath of Object.values(cardAssets)) {
        const img = new Image();
        img.src = imagePath.src;
      }
    }, 2500);
  }, []);

  useInitializeLocalStorageValues();
  usePlayerLeftRoom();
  useRejoinRoom();
  // useAttachUnloadEventListener(); maybe reenable this later on if you can work around bugginess

  return (
    <main
      className={`${montserrat.className} baseVertFlex relative min-h-[100dvh] !justify-between`}
    >
      <Head>
        <title>Squeak</title>
        <meta
          name="description"
          content="Welcome to Squeak! A fun, fast-paced multiplayer rendition of solitaire.
                   Games can be played with 2-4 players, lasting around 20 minutes."
        />
        {/* makes it so page can't be overscrolled (which is the default iOS scrolling implemenation) */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, height=device-height"
        ></meta>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://playsqueak.com" />
        <meta property="og:title" content="Squeak"></meta>
        <meta property="og:url" content="www.playsqueak.com" />
        <meta
          property="og:description"
          content="Welcome to Squeak! A fun, fast-paced multiplayer rendition of solitaire.
                   Games can be played with 2-4 players, lasting around 20 minutes."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://www.playsqueak.com/openGraphImage.png"
        ></meta>
      </Head>

      <AnimatePresence mode="wait">{children}</AnimatePresence>

      <TopRightControls />

      <Toaster
        position={"top-center"}
        toastOptions={{
          duration: 30000,
        }}
      >
        {(t) => <ToastBar toast={t} />}
      </Toaster>
    </main>
  );
}

export default GeneralLayout;
