import { AnimatePresence } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { Montserrat } from "next/font/google";
import { Toaster, ToastBar } from "react-hot-toast";
import TopRightControls from "../TopRightControls/TopRightControls";
import { IoSadSharp } from "react-icons/io5";
import usePlayerLeftRoom from "~/hooks/usePlayerLeftRoom";
import useRejoinRoom from "~/hooks/useRejoinRoom";
import Head from "next/head";
import { useRouter } from "next/router";
import useResetPlayerStateUponPageLoad from "~/hooks/useResetPlayerStateUponPageLoad";
import { useInitializeAudioContext } from "~/hooks/useInitializeAudioContext";
import useGracefullyReconnectToSocket from "~/hooks/useGracefullyReconnectToSocket";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "~/components/ui/alert-dialog";
import { useRoomContext } from "~/context/RoomContext";
import { Button } from "~/components/ui/button";
import useReceiveFriendData from "~/hooks/useReceiveFriendData";
import useInitializeUserStats from "~/hooks/useInitializeUserStats";
import usePostSignUpRegistration from "~/hooks/usePostSignUpRegistration";
import { cardAssets } from "~/utils/cardAssetPaths";

const montserrat = Montserrat({
  weight: "variable",
  subsets: ["latin"],
});

function isIOS() {
  // @ts-expect-error - TS currently doesn't know about the MSStream global
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function getTitleMetadata(path: string) {
  if (path === "/") {
    return "Squeak";
  } else if (path === "/create") {
    return "Create | Squeak";
  } else if (path.includes("/join")) {
    return "Join | Squeak";
  } else if (path.includes("/game")) {
    return "Play | Squeak";
  }

  return "Squeak";
}

interface GeneralLayout {
  children: ReactNode;
}

function GeneralLayout({ children }: GeneralLayout) {
  const { asPath } = useRouter();

  const { showUserWasKickedDialog, setShowUserWasKickedDialog } =
    useRoomContext();

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

  // there was a semi-niche sequence on mobile where user could accidentally end up
  // selecting the entire page while playing a game, so this prevents that
  useEffect(() => {
    if (asPath.includes("/game")) {
      document.documentElement.classList.add("noUserSelect");
    } else {
      document.documentElement.classList.remove("noUserSelect");
    }
  }, [asPath]);

  useEffect(() => {
    // Prefetching/caching card assets to prevent flickering
    const timer = setTimeout(() => {
      const preloadedImages = Object.values(cardAssets).map((imagePath) => {
        const img = new Image();
        img.src = imagePath.src;
        img.width = 0;
        img.height = 0;
        img.style.visibility = "hidden"; // Ensure it's not visible even if somehow it tries to render
        return img;
      });

      // append images to a hidden container
      const container = document.createElement("div");
      container.style.display = "none";
      preloadedImages.forEach((img) => container.appendChild(img));
      document.body.appendChild(container);

      return () => {
        document.body.removeChild(container);
      };
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useGracefullyReconnectToSocket();
  usePlayerLeftRoom();
  useRejoinRoom();
  useResetPlayerStateUponPageLoad();
  useInitializeAudioContext();
  useReceiveFriendData();
  useInitializeUserStats();
  usePostSignUpRegistration();

  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${montserrat.style.fontFamily};
        }
      `}</style>
      <main
        className={`${montserrat.className} baseVertFlex relative min-h-[100dvh] !justify-between`}
      >
        <Head>
          <title>{getTitleMetadata(asPath)}</title>
          <meta
            name="description"
            content="Welcome to Squeak! A fun, fast-paced multiplayer rendition of solitaire.
                   Games can be played with 2-5 players, lasting around 20 minutes."
          />

          {/* PWA related */}
          <meta name="theme-color" content="hsl(120deg, 100%, 86%)" />
          <link rel="manifest" href="/manifest.json" />

          {/* makes it so page can't be overscrolled (which is the default iOS scrolling implemenation) */}
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, height=device-height"
          ></meta>
          <link rel="icon" href="/favicon.ico" />
          <link rel="canonical" href="https://www.playsqueak.com" />
          <meta property="og:title" content="Squeak"></meta>
          <meta property="og:url" content="www.playsqueak.com" />
          <meta
            property="og:description"
            content="Welcome to Squeak! A fun, fast-paced multiplayer rendition of solitaire.
                   Games can be played with 2-5 players, lasting around 20 minutes."
          />
          <meta property="og:type" content="website" />
          <meta
            property="og:image"
            content="https://www.playsqueak.com/openGraphImage.png"
          ></meta>
        </Head>

        <AnimatePresence mode="wait">{children}</AnimatePresence>

        <TopRightControls />

        <AlertDialog open={showUserWasKickedDialog}>
          <AlertDialogContent>
            <AlertDialogTitle className="baseVertFlex gap-2 font-semibold">
              <IoSadSharp className="size-6" />
              You were kicked
            </AlertDialogTitle>

            <AlertDialogDescription className="baseVertFlex mb-4 text-center">
              <p className="w-48 xs:w-auto">
                The room owner has kicked you from the room.
              </p>
            </AlertDialogDescription>

            <div className="baseFlex w-full">
              <Button
                onClick={() => setShowUserWasKickedDialog(false)}
                className="w-3/4"
              >
                I understand
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster
          position={"top-center"}
          toastOptions={{
            duration: 30000,
          }}
        >
          {(t) => <ToastBar toast={t} />}
        </Toaster>
      </main>
    </>
  );
}

export default GeneralLayout;
