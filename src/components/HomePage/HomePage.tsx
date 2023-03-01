import { useState, useEffect } from "react";
import CreateRoom from "../CreateRoom/CreateRoom";
import JoinRoom from "../JoinRoom/JoinRoom";
import Play from "../Play/Play";
import { useRoomContext } from "../../context/RoomContext";
import MainOptions from "../MainOptions/MainOptions";
import { AnimatePresence } from "framer-motion";
import TopRightControls from "../TopRightControls/TopRightControls";
import usePlayerLeftRoom from "../../hooks/usePlayerLeftRoom";
import MobileWarningModal from "../modals/MobileWarningModal";
import { isMobile } from "react-device-detect";

function HomePage() {
  const { connectedToRoom, pageToRender } = useRoomContext();

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
    }, 1500);
  }, []);

  usePlayerLeftRoom();

  return (
    <div className="relative">
      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {pageToRender === "home" && <MainOptions />}
        {pageToRender === "createRoom" && <CreateRoom />}
        {pageToRender === "joinRoom" && <JoinRoom />}
        {pageToRender === "play" && connectedToRoom && <Play />}
      </AnimatePresence>

      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
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
