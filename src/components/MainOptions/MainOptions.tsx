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
import { IoStatsChart } from "react-icons/io5";
import { useSession } from "next-auth/react";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { useUserIDContext } from "../../context/UserIDContext";
import { trpc } from "../../utils/trpc";
import { AnimatePresence, motion } from "framer-motion";
import LeaderboardModal from "../modals/LeaderboardModal";
import { HiExternalLink } from "react-icons/hi";

function MainOptions() {
  const { data: session, status } = useSession();
  const { value: userID } = useUserIDContext();

  // probably want to remove the default "refetch on page focus" behavior
  const { data: user } = trpc.users.getUserByID.useQuery(userID);
  const { setPageToRender } = useRoomContext();

  const [hoveringOnAboutMe, setHoveringOnAboutMe] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  return (
    <motion.div
      key={"mainOptions"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex relative min-h-[100vh]"
    >
      {status !== "loading" && (
        <div className="baseVertFlex min-w-[22.25rem] rounded-md border-2 border-white bg-green-800 p-8 shadow-lg">
          <img
            src="/logo/squeakLogo.svg"
            alt="Squeak logo"
            className="h-48 w-48 tall:h-[300px] tall:w-[300px]"
          />

          {status === "authenticated" ? (
            <div className="baseFlex gap-4">
              <PlayerIcon
                avatarPath={user?.avatarPath}
                borderColor={user?.color}
                size={"3rem"}
              />
              {user?.username ? (
                <div
                  style={{
                    color: "hsl(120, 100%, 86%)",
                  }}
                >
                  {user?.username}
                </div>
              ) : (
                <div className="skeletonLoading h-6 w-28 rounded-sm"></div>
              )}
            </div>
          ) : (
            <LogIn gap={"2rem"} />
          )}

          <div className="baseVertFlex mt-8 gap-4">
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

            <SecondaryButton
              innerText={"Leaderboard"}
              icon={<IoStatsChart size={"1.5rem"} />}
              iconOnLeft={true}
              extraPadding={true}
              onClickFunction={() => setShowLeaderboardModal(true)}
            />
          </div>
        </div>
      )}

      <div
        style={{
          color: "hsl(120, 100%, 86%)",
          borderColor: "hsl(120, 100%, 86%)",
          background: "hsl(120, 100%, 18%)",
          gap: hoveringOnAboutMe ? "2rem" : "0px",
          padding: hoveringOnAboutMe ? "0.5rem 1.5rem" : "0.5rem 1.25rem",
          transition: "all 0.3s ease-in-out",
        }}
        className="baseFlex absolute right-2 bottom-2 gap-2 rounded-full border-2"
        onMouseEnter={() => setHoveringOnAboutMe(true)}
        onMouseLeave={() => setHoveringOnAboutMe(false)}
      >
        <AnimatePresence initial={false} mode={"wait"}>
          {hoveringOnAboutMe && (
            <motion.div
              key={"aboutMe"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, paddingLeft: "0px" }}
              transition={{ duration: 0.27 }}
              className="baseFlex gap-2 overflow-hidden"
            >
              Made by
              <a
                href="https://michaelongaro.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  borderColor: "hsl(120, 100%, 86%)",
                }}
                className="baseFlex gap-2 border-b-2"
              >
                Michael Ongaro
                <HiExternalLink size={"1.5rem"} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="select-none text-2xl">i</div>
      </div>

      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {showTutorialModal && (
          <TutorialModal setShowModal={setShowTutorialModal} />
        )}
      </AnimatePresence>

      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {showLeaderboardModal && (
          <LeaderboardModal setShowModal={setShowLeaderboardModal} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MainOptions;
