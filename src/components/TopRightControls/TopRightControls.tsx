import { useSession } from "next-auth/react";
import React from "react";
import { useRoomContext } from "../../context/RoomContext";
import SecondaryButton from "../Buttons/SecondaryButton";
import UserSettingsAndStatsModal from "../modals/SettingsAndStats/UserSettingsAndStatsModal";
import {
  BsFillVolumeMuteFill,
  BsFillVolumeUpFill,
  BsFillVolumeDownFill,
} from "react-icons/bs";
import { IoSettingsSharp } from "react-icons/io5";
import { FaUserFriends } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";

function TopRightControls() {
  const { status } = useSession();
  const { showSettingsModal, setShowSettingsModal } = useRoomContext();

  // volume state

  return (
    <div className="baseVertFlex absolute top-4 right-4 gap-2 sm:gap-4">
      <SecondaryButton
        icon={<IoSettingsSharp size={"1.5rem"} />}
        extraPadding={false}
        onClickFunction={() => {
          if (status === "authenticated") {
            setShowSettingsModal(true);
          }
        }}
      />

      <SecondaryButton
        icon={<BsFillVolumeMuteFill size={"1.5rem"} />}
        // width={"2.5rem"} // make bigger on hover, need to add prop to SecondaryButton
        extraPadding={false}
      />

      <SecondaryButton
        icon={<FaUserFriends size={"1.5rem"} />}
        extraPadding={false}
      />

      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {showSettingsModal && (
          <UserSettingsAndStatsModal setShowModal={setShowSettingsModal} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TopRightControls;
