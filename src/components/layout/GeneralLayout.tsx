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

const montserrat = Montserrat({
  weight: "variable",
  subsets: ["latin"],
});

interface GeneralLayout {
  children: ReactNode;
}

function GeneralLayout({ children }: GeneralLayout) {
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
        {/* TODO: make sure this doesn't introduce any weird ui bugs, was put in here to prevent
            the safari auto zoom in on input focus */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no"
        />
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
