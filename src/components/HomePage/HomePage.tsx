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
import Image, { type StaticImageData } from "next/image";
import useInitializeLocalStorageValues from "../../hooks/useInitializeLocalStorageValues";
import useAttachUnloadEventListener from "../../hooks/useAttachUnloadEventListener";

function HomePage() {
  const { pageToRender, connectedToRoom } = useRoomContext();

  const [allowedToShowMobileWarningModal, setAllowedToShowMobileWarningModal] =
    useState<boolean>(false);

  const [cardImagesToPreload, setCardImagesToPreload] = useState<
    StaticImageData[]
  >([]);
  const [squeakButtonImagesToPreload, setSqueakButtonImagesToPreload] =
    useState<StaticImageData[]>([]);

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
      const cardImagesToPreload = [] as StaticImageData[];
      const squeakButtonImagesToPreload = [] as StaticImageData[];

      for (const image of Object.values(cardAssets)) {
        if (
          image.src.includes("baseplate") ||
          image.src.includes("buzzerButton")
        ) {
          squeakButtonImagesToPreload.push(image);
        } else {
          cardImagesToPreload.push(image);
        }
      }

      setCardImagesToPreload(cardImagesToPreload);
      setSqueakButtonImagesToPreload(squeakButtonImagesToPreload);
    }, 5000);
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

      {/* need to actually mount the <Image />s so that next can cache
          them properly */}
      <div className="absolute left-0 top-0 opacity-0">
        {cardImagesToPreload.map((image) => (
          <Image
            key={image.src}
            src={image.src}
            alt={image.src}
            width={67}
            height={87}
            style={{
              position: "absolute",
              top: "-10000",
              left: "-10000",
            }}
          />
        ))}

        {squeakButtonImagesToPreload.map((image) => (
          <Image
            key={image.src}
            src={image.src}
            alt={image.src}
            width={image.src.includes("baseplate") ? 75 : 50}
            height={image.src.includes("baseplate") ? 40 : 35}
            style={{
              position: "absolute",
              top: "-10000",
              left: "-10000",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default HomePage;
