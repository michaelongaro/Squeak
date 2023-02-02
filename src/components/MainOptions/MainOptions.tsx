import { useState } from "react";
import { useRoomContext } from "../../context/RoomContext";
import LogIn from "../auth/LogIn";
import TutorialModal from "../modals/TutorialModal";
import TopRightControls from "../TopRightControls/TopRightControls";

function MainOptions() {
  const { setPageToRender } = useRoomContext();

  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);

  return (
    <div className="baseVertFlex relative min-h-[100vh] gap-8 bg-green-700">
      <div className="text-4xl sm:text-5xl">Squeak</div>

      <LogIn gap={"2rem"} />

      <div className="baseVertFlex gap-4">
        <button onClick={() => setShowTutorialModal(true)}>How to play</button>
        <button onClick={() => setPageToRender("createRoom")}>
          Create room
        </button>
        <button onClick={() => setPageToRender("joinRoom")}>Join room</button>
      </div>

      {showTutorialModal && <TutorialModal />}

      <TopRightControls />
    </div>
  );
}

export default MainOptions;
