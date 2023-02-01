import { useEffect, useState } from "react";
import CreateRoom from "../CreateRoom/CreateRoom";
import JoinRoom from "../JoinRoom/JoinRoom";
import Play from "../Play/Play";
import TutorialModal from "../modals/TutorialModal";
import { useRoomContext } from "../../context/RoomContext";
import LogIn from "../auth/LogIn";
import UserSettingsAndStatsModal from "../modals/SettingsAndStats/UserSettingsAndStatsModal";

function HomePage() {
  const { connectedToRoom, pageToRender, setPageToRender } = useRoomContext();
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  return (
    // could make this into a card and have 2-3 diagonal-ish layered playing cards that are peeking out behind left and right sides of card
    <>
      {pageToRender === "home" ? (
        <div className="baseVertFlex relative min-h-[100vh]  gap-8 bg-green-700">
          <div className="text-4xl sm:text-5xl">Squeak</div>

          <LogIn gap={"2rem"} />

          <div className="baseVertFlex gap-4">
            <button onClick={() => setShowTutorialModal(true)}>
              How to play
            </button>
            <button onClick={() => setPageToRender("createRoom")}>
              Create room
            </button>
            <button onClick={() => setPageToRender("joinRoom")}>
              Join room
            </button>
          </div>

          {showTutorialModal && <TutorialModal />}

          {/* maybe make this into its own component so that every page besides play can show it */}
          <div className="baseFlex absolute top-4 right-4 gap-2 sm:gap-4">
            {/* maybe make these buttons in future, but be cautious because you will probably have primary/secondary button
              styles, and I don't think these want those styles */}
            <div>Volume</div>
            <button
              onClick={() => {
                setShowSettingsModal(true);
              }}
            >
              Settings
            </button>
          </div>
          <div className="absolute top-12 right-4">Friends</div>

          {showSettingsModal && (
            <UserSettingsAndStatsModal setShowModal={setShowSettingsModal} />
          )}
        </div>
      ) : (
        <>
          {pageToRender === "createRoom" && <CreateRoom />}
          {pageToRender === "joinRoom" && <JoinRoom />}
          {pageToRender === "play" && connectedToRoom && <Play />}
        </>
      )}
    </>
  );
}

export default HomePage;
