import { useState } from "react";
import { api } from "~/utils/api";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { useUserIDContext } from "~/context/UserIDContext";
import TutorialModal from "~/components/modals/TutorialModal";
import { TbDoorEnter } from "react-icons/tb";
import { AiOutlinePlusCircle, AiOutlineInfoCircle } from "react-icons/ai";
import { IoStatsChart } from "react-icons/io5";
import PlayerIcon from "~/components/playerIcons/PlayerIcon";
import LeaderboardModal from "~/components/modals/LeaderboardModal";
import { HiExternalLink } from "react-icons/hi";
import Image from "next/image";
import logo from "public/logo/squeakLogo.svg";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/router";
import useReceiveFriendData from "~/hooks/useReceiveFriendData";
import useInitializeUserStats from "~/hooks/useInitializeUserStats";
import usePostSignUpRegistration from "~/hooks/usePostSignUpRegistration";
import { useRoomContext } from "~/context/RoomContext";
import Link from "next/link";

function MainOptions() {
  const { isSignedIn } = useAuth();
  const userID = useUserIDContext();
  const { push } = useRouter();

  // probably want to remove the default "refetch on page focus" behavior
  const { data: user } = api.users.getUserByID.useQuery(userID, {
    enabled: userID !== "",
  });

  const { viewportLabel } = useRoomContext();

  const [hoveringOnAboutMe, setHoveringOnAboutMe] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  useReceiveFriendData();
  useInitializeUserStats();

  usePostSignUpRegistration();

  return (
    <motion.div
      key={"mainOptions"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="baseFlex relative min-h-[100dvh] py-4"
    >
      {isSignedIn !== undefined && (
        <div className="baseVertFlex w-[17.5rem] rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 p-6 shadow-lg lg:w-[22.25rem] desktop:p-8">
          <Image
            src={logo}
            alt="Squeak logo"
            priority={true}
            className="h-48 w-48 tablet:h-[300px] tablet:w-[300px]"
          />

          {isSignedIn ? (
            <div className="baseFlex gap-4">
              <PlayerIcon
                avatarPath={user?.avatarPath}
                borderColor={user?.color}
                size={"2.75rem"}
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
                <div className="h-6 w-28 animate-pulse rounded-md bg-muted/50"></div>
              )}
            </div>
          ) : (
            <div className="baseFlex gap-4">
              <SignUpButton mode="modal">
                <Button className="w-28 text-sm font-medium">Sign up</Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button
                  variant={"secondary"}
                  className="!px-4 text-sm font-medium"
                >
                  Sign in
                </Button>
              </SignInButton>
            </div>
          )}

          <div className="baseVertFlex mt-8 gap-4">
            <Button
              variant={"secondary"}
              showCardSuitAccents
              onClick={() => setShowTutorialModal(true)}
              className="baseFlex h-16 w-full !justify-start gap-5"
            >
              <AiOutlineInfoCircle size={"1.5rem"} />
              How to play
            </Button>

            <Button
              variant={"secondary"}
              showCardSuitAccents
              onClick={() => push("/create")}
              className="baseFlex h-16 w-full !justify-start gap-[1.3rem]"
            >
              <AiOutlinePlusCircle size={"1.5rem"} />
              Create room
            </Button>

            <Button
              variant={"secondary"}
              showCardSuitAccents
              onClick={() => push("/join")}
              className="baseFlex h-16 w-full !justify-start gap-6"
            >
              <TbDoorEnter size={"1.5rem"} />
              Join room
            </Button>

            <Button
              variant={"secondary"}
              showCardSuitAccents
              onClick={() => setShowLeaderboardModal(true)}
              className="baseFlex h-16 w-full !justify-start gap-5"
            >
              <IoStatsChart size={"1.5rem"} />
              Leaderboard
            </Button>
          </div>
        </div>
      )}

      {!viewportLabel.includes("mobile") && (
        <div
          style={{
            color: "hsl(120, 100%, 86%)",
            borderColor: "hsl(120, 100%, 86%)",
            background: "hsl(120, 100%, 18%)",
            transition: "all 0.3s ease-in-out",
          }}
          // leading-normal md:leading-6
          className={`baseFlex fixed ${hoveringOnAboutMe ? "shadow-md" : "shadow-none"} ${hoveringOnAboutMe ? "w-[18rem]" : "w-8"} bottom-2 right-2 !justify-end overflow-hidden rounded-full border-2 px-[0.75rem] py-[0.15rem] md:px-[0.7rem] md:py-0 lg:bottom-4 lg:right-4`}
          onPointerEnter={() => setHoveringOnAboutMe(true)}
          onPointerLeave={() => setHoveringOnAboutMe(false)}
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
          <div className="select-none text-base md:text-xl">i</div>
        </div>
      )}

      <Button variant={"link"} asChild>
        <Link
          href="/privacy"
          className="absolute bottom-[-2rem] text-sm !font-medium desktop:bottom-3"
        >
          Privacy Policy
        </Link>
      </Button>

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
