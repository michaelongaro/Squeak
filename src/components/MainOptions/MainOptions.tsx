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
import { useSession } from "next-auth/react";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { useUserIDContext } from "../../context/UserIDContext";
import { trpc } from "../../utils/trpc";

function MainOptions() {
  const { data: session, status } = useSession();
  const { value: userID } = useUserIDContext();

  // probably want to remove the default "refetch on page focus" behavior
  const { data: user } = trpc.users.getUserByID.useQuery(userID);
  const { setPageToRender } = useRoomContext();

  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);

  return (
    <div className="baseFlex relative min-h-[100vh]">
      {status !== "loading" && (
        <div className="baseVertFlex min-w-[22.25rem] gap-8 rounded-md border-2 border-white bg-green-800 p-8 shadow-lg">
          <div className="text-4xl text-green-300 sm:text-5xl">Squeak</div>

          {status === "authenticated" ? (
            <div className="baseFlex gap-4">
              <PlayerIcon
                avatarPath={user?.avatarPath}
                borderColor={user?.color}
                size={"3rem"}
              />
              {user?.username ? (
                <div className="text-green-300">{user?.username}</div>
              ) : (
                <div className="skeletonLoading h-6 w-28 rounded-sm"></div>
              )}
            </div>
          ) : (
            <LogIn gap={"2rem"} />
          )}

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
      )}

      {showTutorialModal && <TutorialModal />}

      <TopRightControls forPlayScreen={false} />
    </div>
  );
}

export default MainOptions;
