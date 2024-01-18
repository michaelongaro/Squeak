import { useState, useEffect } from "react";
import CreateRoom from "../CreateRoom/CreateRoom";
import JoinRoom from "../JoinRoom/JoinRoom";
import Play from "../Play/Play";
import MainOptions from "../MainOptions/MainOptions";
import { AnimatePresence } from "framer-motion";
import TopRightControls from "../TopRightControls/TopRightControls";
import usePlayerLeftRoom from "../../hooks/usePlayerLeftRoom";
import MobileWarningModal from "../modals/MobileWarningModal";
import { isMobile } from "react-device-detect";
import { cardAssets } from "../../utils/cardAssetPaths";
import { useRoomContext } from "../../context/RoomContext";
import useInitializeLocalStorageValues from "../../hooks/useInitializeLocalStorageValues";
import useAttachUnloadEventListener from "../../hooks/useAttachUnloadEventListener";

function HomePage() {
  const { pageToRender, connectedToRoom } = useRoomContext();

  const [allowedToShowMobileWarningModal, setAllowedToShowMobileWarningModal] =
    useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      if (
        isMobile &&
        localStorage.getItem("allowedToShowMobileWarningModal") !== "false"
      ) {
        setAllowedToShowMobileWarningModal(true);
      }
    }, 2500);

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
  useAttachUnloadEventListener();

  return (
    // pb-8 pt-8 lg:pt-0 lg:pb-0
    <div className="relative ">
      <AnimatePresence mode={"wait"}>
        {pageToRender === "home" && <MainOptions />}
        {pageToRender === "createRoom" && <CreateRoom />}
        {pageToRender === "joinRoom" && <JoinRoom />}
        {pageToRender === "play" && connectedToRoom && <Play />}
      </AnimatePresence>

      <AnimatePresence mode={"wait"}>
        {allowedToShowMobileWarningModal && (
          <MobileWarningModal
            setShowModal={setAllowedToShowMobileWarningModal}
          />
        )}
      </AnimatePresence>

      <TopRightControls forPlayScreen={pageToRender === "play"} />
    </div>
  );
}

export default HomePage;
