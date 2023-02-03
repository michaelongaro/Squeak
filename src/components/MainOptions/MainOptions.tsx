import { useState } from "react";
import { useRoomContext } from "../../context/RoomContext";
import LogIn from "../auth/LogIn";
import SecondaryButton from "../Buttons/SecondaryButton";
import TutorialModal from "../modals/TutorialModal";
import TopRightControls from "../TopRightControls/TopRightControls";
import { ImEnter } from "react-icons/im";
import {
  AiFillPlusCircle,
  AiOutlinePlusCircle,
  AiOutlineInfoCircle,
} from "react-icons/ai";

function MainOptions() {
  const { setPageToRender } = useRoomContext();

  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);

  return (
    <div className="baseFlex relative min-h-[100vh]">
      <div className="baseVertFlex gap-8 rounded-md border-2 border-white bg-green-800 p-8 shadow-lg">
        <div className="text-4xl text-green-300 sm:text-5xl">Squeak</div>

        <LogIn gap={"2rem"} />

        <div className="baseVertFlex gap-4">
          <SecondaryButton
            innerText={"How to play"}
            icon={<AiOutlineInfoCircle size={"1.5rem"} />}
            iconOnLeft={true}
            extraPadding={true}
            onClickFunction={() => setShowTutorialModal(true)}
          />

          <SecondaryButton
            innerText={"Create room"}
            icon={<AiOutlinePlusCircle size={"1.5rem"} />}
            iconOnLeft={true}
            extraPadding={true}
            onClickFunction={() => setPageToRender("createRoom")}
          />

          <SecondaryButton
            innerText={"Join room"}
            icon={<ImEnter size={"1.5rem"} />}
            iconOnLeft={true}
            extraPadding={true}
            onClickFunction={() => setPageToRender("joinRoom")}
          />

          {/* leaderboard */}
        </div>
      </div>

      {showTutorialModal && <TutorialModal />}

      <TopRightControls />
    </div>
  );
}

export default MainOptions;
