import { useSession } from "next-auth/react";
import React from "react";
import { useRoomContext } from "../../context/RoomContext";
import UserSettingsAndStatsModal from "../modals/SettingsAndStats/UserSettingsAndStatsModal";

function TopRightControls() {
  const { status } = useSession();
  const { showSettingsModal, setShowSettingsModal } = useRoomContext();

  return (
    <>
      <div className="baseFlex absolute top-4 right-4 gap-2 sm:gap-4">
        {/* maybe make these buttons in future, but be cautious because you will probably have primary/secondary button
              styles, and I don't think these want those styles */}
        <div>Volume</div>
        <button
          // have styles for lowering opacity a bit when not authenticated
          // and hovering/clicking + prob a tooltip saying you need to be logged in
          onClick={() => {
            if (status === "authenticated") {
              setShowSettingsModal(true);
            }
          }}
        >
          Settings
        </button>
      </div>

      {/* maybe you shouldn't even show this (will need to be a component) 
          if not logged in? */}
      <div className="absolute top-12 right-4">Friends</div>

      {showSettingsModal && (
        <UserSettingsAndStatsModal setShowModal={setShowSettingsModal} />
      )}
    </>
  );
}

export default TopRightControls;
