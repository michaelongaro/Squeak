import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRoomContext } from "../../context/RoomContext";
import SecondaryButton from "../Buttons/SecondaryButton";
import UserSettingsAndStatsModal from "../modals/SettingsAndStats/UserSettingsAndStatsModal";
import { IoSettingsSharp, IoLogOutOutline } from "react-icons/io5";
import { FaUserFriends } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import FriendsList from "../modals/FriendsList";
import AudioLevelSlider from "./AudioLevelSlider";
import useLeaveRoom from "../../hooks/useLeaveRoom";

interface ITopRightControls {
  forPlayScreen: boolean;
}

function TopRightControls({ forPlayScreen }: ITopRightControls) {
  const { status } = useSession();

  const { showSettingsModal, setShowSettingsModal, newInviteNotification } =
    useRoomContext();

  const leaveRoom = useLeaveRoom();

  const [showFriendsList, setShowFriendsList] = useState<boolean>(false);

  return (
    <div
      style={{
        alignItems: !forPlayScreen ? "flex-end" : "center",
      }}
      className={`${
        forPlayScreen ? "baseFlex" : "baseVertFlex"
      } fixed top-1 right-1 z-[999] !min-w-fit gap-2 sm:gap-4 lg:top-4 lg:right-4`}
    >
      {!forPlayScreen && (
        <div className="w-[44px]">
          <SecondaryButton
            icon={<IoSettingsSharp size={"1.5rem"} />}
            extraPadding={false}
            disabled={status !== "authenticated"}
            hoverTooltipText={"Only available for logged in users"}
            hoverTooltipTextPosition={"left"}
            onClickFunction={() => {
              if (status === "authenticated") {
                setShowSettingsModal(true);
              }
            }}
          />
        </div>
      )}

      <AudioLevelSlider />

      {forPlayScreen && (
        <SecondaryButton
          icon={<IoLogOutOutline size={"1.5rem"} />}
          extraPadding={false}
          onClickFunction={() => leaveRoom(true)}
        />
      )}

      {!forPlayScreen && (
        <div className="relative">
          <SecondaryButton
            icon={<FaUserFriends size={"1.5rem"} />}
            extraPadding={false}
            disabled={status !== "authenticated"}
            hoverTooltipText={"Only available for logged in users"}
            hoverTooltipTextPosition={"left"}
            onClickFunction={() => setShowFriendsList(!showFriendsList)}
          />

          <AnimatePresence mode={"wait"}>
            {newInviteNotification && (
              <motion.div
                key={"friendsListInviteNotification"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-[-5px] right-[-5px] h-4 w-4 rounded-[50%] bg-red-600"
              ></motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode={"wait"}>
            {showFriendsList && (
              <FriendsList setShowFriendsListModal={setShowFriendsList} />
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence mode={"wait"}>
        {showSettingsModal && (
          <UserSettingsAndStatsModal setShowModal={setShowSettingsModal} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TopRightControls;
