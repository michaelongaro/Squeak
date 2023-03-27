import { useState, useEffect } from "react";
import { useRoomContext } from "../../context/RoomContext";
import LogIn from "../auth/LogIn";
import SecondaryButton from "../Buttons/SecondaryButton";
import TutorialModal from "../modals/TutorialModal";
import { ImEnter } from "react-icons/im";
import { AiOutlinePlusCircle, AiOutlineInfoCircle } from "react-icons/ai";
import { IoStatsChart } from "react-icons/io5";
import { useSession } from "next-auth/react";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { useUserIDContext } from "../../context/UserIDContext";
import { trpc } from "../../utils/trpc";
import { AnimatePresence, motion } from "framer-motion";
import LeaderboardModal from "../modals/LeaderboardModal";
import { HiExternalLink } from "react-icons/hi";
import Image from "next/image";
import logo from "../../../public/logo/squeakLogo.svg";

function MainOptions() {
  const { status } = useSession();
  const userID = useUserIDContext();

  // probably want to remove the default "refetch on page focus" behavior
  const { data: user } = trpc.users.getUserByID.useQuery(userID);
  const { setPageToRender } = useRoomContext();

  const [hoveringOnAboutMe, setHoveringOnAboutMe] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const [loginGap, setLoginGap] = useState("2rem");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLoginGap("1rem");
      } else {
        setLoginGap("2rem");
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <motion.div
      key={"mainOptions"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex relative min-h-[100dvh]"
    >
      {status !== "loading" && (
        <div className="baseVertFlex w-[18rem] rounded-md border-2 border-white bg-green-800 p-4 shadow-lg lg:w-[22.25rem] lg:p-8">
          <Image
            src={logo}
            alt="Squeak logo"
            priority={true}
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
            <LogIn gap={loginGap} />
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
          width: hoveringOnAboutMe ? "18rem" : "2.65rem",
          padding: "0.25rem 1rem",
          transition: "all 0.3s ease-in-out",
        }}
        className="baseFlex fixed right-1 bottom-1 !justify-end overflow-hidden rounded-full border-2 lg:right-4 lg:bottom-4"
        onMouseEnter={() => setHoveringOnAboutMe(true)}
        onMouseLeave={() => setHoveringOnAboutMe(false)}
      >
        <AnimatePresence>
          {hoveringOnAboutMe && (
            <motion.div
              key={"aboutMe"}
              initial={{
                opacity: 0,
                scale: 0,
                translateX: -450, // used to avoid jumping of text when animating in
              }}
              animate={{ opacity: 1, scale: 1, translateX: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                opacity: { duration: 0.15 },
                scale: { duration: 0.15 },
                translateX: { duration: 0.45 },
              }}
              className="baseFlex absolute left-[1rem] gap-2 overflow-hidden"
            >
              Made by
              <a
                href="https://michaelongaro.com"
                target="_blank"
                rel="noreferrer"
                className="baseFlex gap-1 underline underline-offset-4"
              >
                Michael Ongaro
                <HiExternalLink size={"1.25rem"} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="select-none text-2xl">i</div>
      </div>

      <AnimatePresence mode={"wait"}>
        {showTutorialModal && (
          <TutorialModal setShowModal={setShowTutorialModal} />
        )}
      </AnimatePresence>

      <AnimatePresence mode={"wait"}>
        {showLeaderboardModal && (
          <LeaderboardModal setShowModal={setShowLeaderboardModal} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MainOptions;
