import React, { useState, useEffect, useRef } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { useAuth } from "@clerk/nextjs";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../pages/api/socket";
import UserSettingsAndStatsModal, {
  type ILocalPlayerSettings,
} from "../modals/SettingsAndStats/UserSettingsAndStatsModal";
import { IoSettingsSharp } from "react-icons/io5";
import { TbDoorExit } from "react-icons/tb";
import { FiMail } from "react-icons/fi";
import { FaUserFriends } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { TbDoorEnter } from "react-icons/tb";
import AudioLevelSlider from "./AudioLevelSlider";
import useLeaveRoom from "../../hooks/useLeaveRoom";
import { MdHowToVote } from "react-icons/md";
import { FaArrowsRotate } from "react-icons/fa6";
import { IoIosCheckmark } from "react-icons/io";
import { IoClose, IoSave } from "react-icons/io5";
import useVoteHasBeenCast from "~/hooks/useVoteHasBeenCast";
import toast from "react-hot-toast";
import { HiExternalLink } from "react-icons/hi";
import { IoIosArrowForward } from "react-icons/io";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Drawer,
  DrawerContent,
  DrawerPortal,
  DrawerTrigger,
} from "~/components/ui/drawer";
import FriendsList from "../modals/FriendsList";
import { useRouter } from "next/router";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { IoStatsChart } from "react-icons/io5";
import PlayerCustomizationPreview from "../playerIcons/PlayerCustomizationPreview";
import PlayerCustomizationPicker from "../playerIcons/PlayerCustomizationPicker";
import { useUserIDContext } from "~/context/UserIDContext";
import Filter from "bad-words";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { type User } from "@prisma/client";

const filter = new Filter();

type allViewLabels =
  | "Settings"
  | "Statistics"
  | "Friends list"
  | "Friend actions"
  | "avatar"
  | "front"
  | "back";
const mainViewLabels = ["Settings", "Statistics", "Friends list"] as const;
const settingsViewLabels = ["avatar", "front", "back"] as const;

function TopRightControls() {
  const { isSignedIn, isLoaded } = useAuth();
  const { asPath } = useRouter();

  const {
    showSettingsModal,
    setShowSettingsModal,
    newInviteNotification,
    voteType,
    votingIsLockedOut,
    showVotingModal,
    setShowVotingModal,
    showVotingOptionButtons,
    setShowVotingOptionButtons,
    viewportLabel,
  } = useRoomContext();

  const leaveRoom = useLeaveRoom({
    routeToNavigateTo: "/",
  });
  useVoteHasBeenCast();

  const [showFriendsList, setShowFriendsList] = useState<boolean>(false);

  const [voteWasStarted, setVoteWasStarted] = useState(false);

  const [showDrawer, setShowDrawer] = useState(false);

  const [showSettingsUnauthTooltip, setShowSettingsUnauthTooltip] =
    useState(false);
  const [showFriendsListUnauthTooltip, setShowFriendsListUnauthTooltip] =
    useState(false);

  useEffect(() => {
    if (
      window.innerWidth <= 1000 &&
      voteType !== null &&
      showVotingOptionButtons
    ) {
      toast.custom((t) => (
        <VotingModalToast
          isVisible={t.visible}
          showVotingOptionButtons={showVotingOptionButtons}
          setShowVotingOptionButtons={setShowVotingOptionButtons}
        />
      ));
    }
  }, [voteType, showVotingOptionButtons, setShowVotingOptionButtons]);

  // TODO: make sure that this logic actually works... definitely doesn't bring up
  // voting modal 100% of time, maybe unless the page was already focused?
  useEffect(() => {
    if (!voteWasStarted && voteType !== null) {
      setVoteWasStarted(true);
      setShowVotingModal(true);
    } else if (voteWasStarted && voteType === null) {
      setVoteWasStarted(false);
      setShowVotingModal(false);

      setTimeout(() => {
        setShowVotingOptionButtons(true);
      }, 1000); // resetting this to true after the modal has finished animating out
    }
  }, [
    voteWasStarted,
    voteType,
    setShowVotingModal,
    setShowVotingOptionButtons,
  ]);

  if (viewportLabel.includes("mobile")) {
    return (
      <Drawer
        open={showDrawer}
        onOpenChange={(isOpen) => setShowDrawer(isOpen)}
      >
        <div
          className={`baseFlex fixed right-2 !z-[150] h-8 w-8 ${
            !asPath.includes("/game") ? "top-3" : "top-1.5"
          }`}
        >
          <DrawerTrigger onClick={() => setShowDrawer(true)}>
            <IoSettingsSharp
              size={"1.25rem"}
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="transition-all active:brightness-50"
            />
          </DrawerTrigger>
        </div>
        <DrawerPortal>
          <DrawerContent
            style={{
              color: "hsl(120deg 100% 18%)",
              zIndex: 250,
            }}
          >
            {asPath.includes("/game") ? (
              <WhilePlayingDrawer
                setShowDrawer={setShowDrawer}
                leaveRoom={leaveRoom}
                showVotingOptionButtons={showVotingOptionButtons}
                setShowVotingOptionButtons={setShowVotingOptionButtons}
              />
            ) : (
              <MainDrawer
                status={
                  isLoaded
                    ? isSignedIn
                      ? "authenticated"
                      : "unauthenticated"
                    : "loading"
                }
                setShowDrawer={setShowDrawer}
              />
            )}
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    );
  }

  return (
    <div
      style={{
        alignItems: !asPath.includes("/game") ? "flex-end" : "center",
      }}
      className={`${
        asPath.includes("/game") ? "baseFlex" : "baseVertFlex"
      } fixed right-1 top-1 z-[190] !min-w-fit gap-3 sm:gap-4 lg:right-4 lg:top-4`}
    >
      {!asPath.includes("/game") && (
        <div
          onMouseEnter={() => {
            if (!isSignedIn) {
              setShowSettingsUnauthTooltip(true);
            }
          }}
          onMouseLeave={() => {
            if (!isSignedIn) {
              setShowSettingsUnauthTooltip(false);
            }
          }}
        >
          <TooltipProvider>
            <Tooltip open={showSettingsUnauthTooltip}>
              <TooltipTrigger asChild>
                <Button
                  variant={"secondary"}
                  disabled={!isSignedIn}
                  onClick={() => {
                    if (isSignedIn) {
                      setShowSettingsModal(true);
                    }
                  }}
                  className="h-[40px] w-[40px] md:h-[44px] md:w-[44px]"
                >
                  <IoSettingsSharp size={"1.5rem"} />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side={"left"}
                className="border-2 border-lightGreen bg-darkGreen text-lightGreen"
              >
                <p>Log in to access</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <AudioLevelSlider />

      {asPath.includes("/game") && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="size-11 !shrink-0">
                <TbDoorExit size={"1.5rem"} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="baseVertFlex gap-8">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center">
                  Are you sure you want to leave the game?
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter className="baseFlex !justify-center gap-4 sm:gap-8">
                <AlertDialogCancel asChild>
                  <Button variant={"secondary"} className="w-24">
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant={"destructive"}
                    className="w-24"
                    onClick={() => {
                      leaveRoom();
                    }}
                  >
                    Confirm
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="absolute right-0 top-[60px]">
            <Button
              variant={"secondary"}
              onClick={() => setShowVotingModal(true)}
              className="absolute right-0 top-0 size-11"
            >
              <MdHowToVote size={"1.5rem"} />
            </Button>

            {votingIsLockedOut && (
              <motion.div
                key={"desktopVotingCooldownTimer"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="cooldownVoteTimer absolute right-0 top-0"
              ></motion.div>
            )}

            <AnimatePresence mode="wait">
              {showVotingModal && (
                <VotingModal
                  showVotingOptionButtons={showVotingOptionButtons}
                  setShowVotingOptionButtons={setShowVotingOptionButtons}
                />
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {!asPath.includes("/game") && (
        <div className="relative h-[40px] w-[40px] md:h-[44px] md:w-[44px]">
          <div
            onMouseEnter={() => {
              if (!isSignedIn) {
                setShowFriendsListUnauthTooltip(true);
              }
            }}
            onMouseLeave={() => {
              if (!isSignedIn) {
                setShowFriendsListUnauthTooltip(false);
              }
            }}
          >
            <TooltipProvider>
              <Tooltip open={showFriendsListUnauthTooltip}>
                <TooltipTrigger asChild>
                  <Button
                    variant={"secondary"}
                    disabled={!isSignedIn}
                    className="absolute right-0 top-0 size-11"
                    onClick={() => setShowFriendsList(!showFriendsList)}
                  >
                    <FaUserFriends size={"1.5rem"} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side={"left"}
                  className="border-2 border-lightGreen bg-darkGreen text-lightGreen"
                >
                  <p>Log in to access</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <AnimatePresence mode={"wait"}>
            {newInviteNotification && (
              <motion.div
                key={"friendsListInviteNotification"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-[-5px] right-[-5px] h-4 w-4 rounded-[50%] bg-red-600"

                // TODO: probably add tw-pulse class to this
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

interface IVotingModal {
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDrawer?: React.Dispatch<React.SetStateAction<boolean>>;
  forMobile?: boolean;
  forDrawer?: boolean;
}

function VotingModal({
  showVotingOptionButtons,
  setShowVotingOptionButtons,
  setShowDrawer,
  forMobile,
  forDrawer,
}: IVotingModal) {
  const {
    roomConfig,
    playerMetadata,
    currentVotes,
    voteType,
    votingIsLockedOut,
    votingLockoutStartTimestamp,
  } = useRoomContext();

  const rotateDecksButtonRef = useRef<HTMLDivElement | null>(null);
  const finishRoundButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      forDrawer &&
      votingLockoutStartTimestamp &&
      rotateDecksButtonRef.current &&
      finishRoundButtonRef.current
    ) {
      const elapsedSeconds = (Date.now() - votingLockoutStartTimestamp) / 1000;

      rotateDecksButtonRef.current!.style.animation = `timer 30s linear -${elapsedSeconds}s`;
      rotateDecksButtonRef.current!.style.animationPlayState = "running";

      finishRoundButtonRef.current!.style.animation = `timer 30s linear -${elapsedSeconds}s`;
      finishRoundButtonRef.current!.style.animationPlayState = "running";
    }
  }, [
    forDrawer,
    votingLockoutStartTimestamp,
    finishRoundButtonRef,
    rotateDecksButtonRef,
  ]);

  return (
    <motion.div
      key={"votingModal"}
      initial={{
        opacity: forMobile ? 1 : 0,
        width: forMobile ? "100%" : "10rem",
      }}
      animate={{ opacity: 1, width: forMobile ? "100%" : "15rem" }}
      exit={{
        opacity: forMobile ? 1 : 0,
        width: forMobile ? "100%" : "10rem",
      }}
      transition={{ duration: forMobile ? 0 : 0.15 }}
      className={`z-200 ${!forMobile ? "absolute right-0 top-0" : ""}`}
    >
      {/* voting modal */}
      <div
        style={{
          borderColor: `hsl(120deg 100% ${forDrawer ? "18%" : "86%"}`,
          backgroundColor: "hsl(120deg 100% 18%)",
        }}
        className="baseVertFlex rounded-md border-2"
      >
        <div
          style={{
            backgroundColor: "hsl(120deg 100% 86%)",
            color: "hsl(120deg 100% 18%)",
          }}
          className={`baseFlex w-full gap-4 px-4 py-2 ${
            forDrawer ? "rounded-sm" : ""
          }`}
        >
          <AnimatePresence mode="wait">
            {voteType !== null && (
              <motion.div
                key={"votingModalProgressRing"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-5 w-5"
              >
                <div className="countdownTimerToast"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {voteType === null ? (
            <p className="font-semibold">Start a vote to...</p>
          ) : (
            <p className="font-semibold">
              {voteType === "rotateDecks"
                ? "Rotate decks?"
                : "Finish the round?"}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {voteType !== null && (
            <motion.div
              key={"votingModalVoteCount"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`baseFlex w-full gap-4 ${
                showVotingOptionButtons ? "px-4 pb-2 pt-4" : "p-4"
              }`}
            >
              {Object.keys(playerMetadata).map((playerID, idx) => {
                return (
                  <div
                    key={`${playerID}${idx}`}
                    style={{
                      backgroundColor:
                        currentVotes[idx] !== undefined
                          ? currentVotes[idx] === "agree"
                            ? "#15803d"
                            : "#b91c1c"
                          : "#e2e2e2",
                    }}
                    className={`h-4 w-full rounded-full ${
                      currentVotes[idx] === undefined ? "animate-pulse" : ""
                    } transition-colors`}
                  ></div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showVotingOptionButtons && (
            <motion.div
              key={"votingModalVoteButtons"}
              initial={{
                opacity: 1,
                height: "auto",
                paddingTop: "1rem",
                paddingBottom: "1rem",
              }}
              animate={{
                opacity: 1,
                height: "auto",
                paddingTop: "1rem",
                paddingBottom: "1rem",
              }}
              exit={{
                opacity: 0,
                height: 0,
                paddingTop: 0,
                paddingBottom: 0,
              }}
              transition={{
                opacity: { duration: 0 },
                height: { duration: 0.3 },
                paddingTop: { duration: 0.3 },
                paddingBottom: { duration: 0.3 },
              }}
              className="baseFlex w-full px-4"
            >
              {voteType === null ? (
                <div className="baseFlex w-full gap-4 tablet:!flex-col">
                  <div className="relative h-12 w-full">
                    <Button
                      variant={"secondary"}
                      onClick={() => {
                        setShowVotingOptionButtons(false);

                        toast.dismiss();
                        setShowDrawer?.(false);

                        socket.emit("castVote", {
                          roomCode: roomConfig.code,
                          voteType: "rotateDecks",
                          voteDirection: "for",
                        });
                      }}
                      className="absolute left-0 top-0 h-12 w-full gap-[0.8rem] text-sm"
                    >
                      Rotate decks
                      <FaArrowsRotate size={"1rem"} />
                    </Button>

                    {votingIsLockedOut && (
                      <motion.div
                        key={"rotateDecksCooldownTimer"}
                        ref={rotateDecksButtonRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="drawerCooldownVoteTimer absolute right-0 top-0"
                      ></motion.div>
                    )}
                  </div>

                  <div className="relative h-12 w-full">
                    <Button
                      variant={"secondary"}
                      onClick={() => {
                        setShowVotingOptionButtons(false);

                        toast.dismiss();
                        setShowDrawer?.(false);

                        socket.emit("castVote", {
                          roomCode: roomConfig.code,
                          voteType: "finishRound",
                          voteDirection: "for",
                        });
                      }}
                      className="absolute left-0 top-0 h-12 w-full gap-[0.8rem] whitespace-nowrap text-sm"
                    >
                      Finish the round
                      <FaArrowsRotate size={"1rem"} />
                    </Button>

                    {votingIsLockedOut && (
                      <motion.div
                        key={"finishRoundCooldownTimer"}
                        ref={finishRoundButtonRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="drawerCooldownVoteTimer absolute right-0 top-0"
                      ></motion.div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="baseFlex w-full gap-2">
                  <Button
                    variant={"secondary"}
                    onClick={() => {
                      setShowVotingOptionButtons(false);

                      toast.dismiss();
                      setShowDrawer?.(false);

                      socket.emit("castVote", {
                        roomCode: roomConfig.code,
                        voteType,
                        voteDirection: "for",
                      });
                    }}
                    className="h-8 w-1/2 gap-2"
                  >
                    Yes
                    <IoIosCheckmark size={"2rem"} />
                  </Button>

                  <Button
                    variant={"secondary"}
                    onClick={() => {
                      setShowVotingOptionButtons(false);

                      toast.dismiss();
                      setShowDrawer?.(false);

                      socket.emit("castVote", {
                        roomCode: roomConfig.code,
                        voteType,
                        voteDirection: "against",
                      });
                    }}
                    className="h-8 w-1/2 gap-2"
                  >
                    No
                    <IoClose size={"1.25rem"} />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface IVotingModalToast {
  isVisible: boolean;
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: React.Dispatch<React.SetStateAction<boolean>>;
}

// needed to extract this to custom component because the exit animations weren't working on the toast
function VotingModalToast({
  isVisible,
  showVotingOptionButtons,
  setShowVotingOptionButtons,
}: IVotingModalToast) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={"votingModalToast"}
          initial={{ opacity: 0, translateY: "-100%" }}
          animate={{ opacity: 1, translateY: "0%" }}
          exit={{ opacity: 0, translateY: "-100%" }}
          transition={{
            opacity: { duration: 0.15 },
            translateY: { duration: 0.35 },
          }}
          className={`baseFlex pointer-events-auto h-full w-full max-w-96 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5`}
        >
          <VotingModal
            showVotingOptionButtons={showVotingOptionButtons}
            setShowVotingOptionButtons={setShowVotingOptionButtons}
            forMobile
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface IMainDrawer {
  status: "authenticated" | "loading" | "unauthenticated";
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
}

function MainDrawer({ status, setShowDrawer }: IMainDrawer) {
  const { signOut } = useAuth();

  const [renderedView, setRenderedView] = useState<allViewLabels | undefined>();

  const [localPlayerMetadata, setLocalPlayerMetadata] =
    useState<IRoomPlayersMetadata>({} as IRoomPlayersMetadata);
  const [localPlayerSettings, setLocalPlayerSettings] =
    useState<ILocalPlayerSettings>({} as ILocalPlayerSettings);

  const [friendBeingViewed, setFriendBeingViewed] = useState<User | null>(null);

  // TODO: idk you can add the motion.div to opacity + scale up icon + label later if you think it's necessary

  function getDrawerHeight() {
    switch (renderedView) {
      case "Settings":
        return "500px";
      case "Statistics":
        return "400px";
      case "Friends list":
        return "500px";
      case "Friend actions":
        return "280px";
      case "avatar":
        return "350px";
      case "front":
        return "225px";
      case "back":
        return "430px";
      default:
        return status === "unauthenticated" ? "384px" : "438px";
    }
  }

  return (
    <div
      style={{
        height: getDrawerHeight(),
        transition: "height 0.3s ease-in-out",
      }}
      className="baseVertFlex w-full"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {renderedView === undefined && (
          <motion.div
            key="mainDrawerTopButtons"
            initial={{ opacity: 0, translateX: "-100%" }}
            animate={{ opacity: 1, translateX: "0%" }}
            exit={{ opacity: 0, translateX: "-100%" }}
            transition={{
              duration: 0.3,
            }}
            className="baseVertFlex w-screen"
          >
            {mainViewLabels.map((label) => (
              <Button
                key={label}
                variant={"drawer"}
                disabled={status === "unauthenticated"}
                style={{
                  borderTopWidth: label === "Settings" ? "0px" : "1px",
                }}
                showArrow
                className="baseFlex h-20 w-full !justify-start"
                onClick={() => setRenderedView(label)}
              >
                <div className="baseFlex gap-4 text-lg font-semibold">
                  {label === "Settings" && <IoSettingsSharp size={"1.5rem"} />}
                  {label === "Statistics" && <IoStatsChart size={"1.5rem"} />}
                  {label === "Friends list" && (
                    <FaUserFriends size={"1.5rem"} />
                  )}
                  {label}
                </div>
              </Button>
            ))}

            <div className="baseVertFlex w-full !items-start gap-2 border-y-[1px] border-darkGreen px-2 py-4">
              <Label className="pl-1">Volume</Label>
              <AudioLevelSlider forMobile />
            </div>

            {status === "authenticated" && (
              <div className="baseFlex w-full px-2 pt-4">
                <Button
                  variant={"secondary"}
                  onClick={() => {
                    setShowDrawer(false);
                    signOut();
                  }}
                  className="h-10 w-32"
                >
                  Log out
                </Button>
              </div>
            )}

            <div className="baseFlex mr-2 gap-1.5 py-2 text-sm">
              Made by
              <a
                href="https://michaelongaro.com"
                target="_blank"
                rel="noreferrer"
                className="baseFlex !items-end gap-1 underline underline-offset-4"
              >
                Michael Ongaro
                <HiExternalLink size={"1rem"} />
              </a>
            </div>
          </motion.div>
        )}

        {/* inner content "views" */}
        {(renderedView === "Settings" ||
          renderedView === "Statistics" ||
          renderedView === "Friends list") && (
          <motion.div
            key={`${renderedView}Content`}
            initial={{ opacity: 0, translateX: "100%" }}
            animate={{ opacity: 1, translateX: "0%" }}
            exit={{ opacity: 0, translateX: "100%" }}
            transition={{
              duration: 0.3,
            }}
            className={
              "baseVertFlex color-darkGreen relative h-full w-screen bg-zinc-200"
            }
          >
            {renderedView === "Settings" && (
              <DrawerSettings
                setRenderedView={setRenderedView}
                localPlayerMetadata={localPlayerMetadata}
                setLocalPlayerMetadata={setLocalPlayerMetadata}
                localPlayerSettings={localPlayerSettings}
                setLocalPlayerSettings={setLocalPlayerSettings}
              />
            )}

            {renderedView === "Statistics" && (
              <DrawerStatistics setRenderedView={setRenderedView} />
            )}

            {renderedView === "Friends list" && (
              <DrawerFriendsList
                setRenderedView={setRenderedView}
                setFriendBeingViewed={setFriendBeingViewed}
                setShowDrawer={setShowDrawer}
              />
            )}
          </motion.div>
        )}

        {/* avatar/front/back views here */}
        {(renderedView === "avatar" ||
          renderedView === "front" ||
          renderedView === "back") && (
          <motion.div
            key={`${renderedView}Picker`}
            initial={{ opacity: 0, translateX: "100%" }}
            animate={{ opacity: 1, translateX: "0%" }}
            exit={{ opacity: 0, translateX: "100%" }}
            transition={{
              duration: 0.3,
            }}
            className={"baseVertFlex relative h-full w-screen bg-zinc-200"}
          >
            <div className="absolute left-0 top-0 z-10 h-8 w-full bg-zinc-200">
              <Button
                variant={"ghost"}
                onClick={() => setRenderedView("Settings")}
                className="baseFlex absolute left-2 top-0 gap-2 !p-0"
              >
                <IoIosArrowForward size={"1rem"} className="rotate-180" />
                Back
              </Button>
            </div>

            <p className="text-lg font-semibold underline underline-offset-2">
              {renderedView === "avatar"
                ? "Avatar"
                : renderedView === "front"
                  ? "Card front"
                  : "Card back"}
            </p>
            <PlayerCustomizationPicker
              type={renderedView}
              forDrawer
              localPlayerMetadata={localPlayerMetadata}
              setLocalPlayerMetadata={setLocalPlayerMetadata}
              setLocalPlayerSettings={setLocalPlayerSettings}
            />
          </motion.div>
        )}

        {friendBeingViewed && renderedView === "Friend actions" && (
          <motion.div
            key={`friendActions`}
            initial={{ opacity: 0, translateX: "100%" }}
            animate={{ opacity: 1, translateX: "0%" }}
            exit={{ opacity: 0, translateX: "100%" }}
            transition={{
              duration: 0.3,
            }}
            className={
              "baseVertFlex relative h-full w-screen !justify-end bg-zinc-200"
            }
          >
            <FriendActions
              friend={friendBeingViewed}
              setRenderedView={setRenderedView}
              setShowDrawer={setShowDrawer}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface IDrawerSettings {
  localPlayerMetadata: IRoomPlayersMetadata;
  setLocalPlayerMetadata: React.Dispatch<
    React.SetStateAction<IRoomPlayersMetadata>
  >;
  localPlayerSettings: ILocalPlayerSettings;
  setLocalPlayerSettings: React.Dispatch<
    React.SetStateAction<ILocalPlayerSettings>
  >;
  setRenderedView: React.Dispatch<
    React.SetStateAction<allViewLabels | undefined>
  >;
}

function DrawerSettings({
  localPlayerMetadata,
  localPlayerSettings,
  setLocalPlayerMetadata,
  setLocalPlayerSettings,
  setRenderedView,
}: IDrawerSettings) {
  const userID = useUserIDContext();
  const {
    playerMetadata,
    setPlayerMetadata,
    connectedToRoom,
    setMirrorPlayerContainer,
  } = useRoomContext();

  const utils = api.useUtils();
  const { data: user } = api.users.getUserByID.useQuery(userID);
  const updateUser = api.users.updateUser.useMutation({
    onMutate: () => {
      // relatively sure we are doing this wrong with the "keys" that it is going off of.
      utils.users.getUserByID.cancel(userID);
      const optimisticUpdate = utils.users.getUserByID.getData(userID);

      if (optimisticUpdate) {
        // does this implementation of userID as a query string work?
        utils.users.getUserByID.setData(userID, optimisticUpdate);
      }
    },
    onSettled: () => {
      setTimeout(() => {
        setSaveButtonText("Saved");
        utils.users.getUserByID.invalidate(userID);

        setTimeout(() => {
          setSaveButtonText("Save");
        }, 1000);
      }, 1000);
    },
  });

  const [ableToSave, setAbleToSave] = useState<boolean>(false);
  const [saveButtonText, setSaveButtonText] = useState<string>("Save");
  const [usernameIsProfane, setUsernameIsProfane] = useState<boolean>(false);

  useEffect(() => {
    if (
      user === undefined ||
      user === null ||
      localPlayerMetadata[userID] ||
      localPlayerSettings.desktopNotifications !== undefined // prob delete, even necessary to check this?
    )
      return;
    setLocalPlayerMetadata({
      [userID]: {
        username: user.username,
        avatarPath: user.avatarPath,
        color: user.color,
        deckHueRotation: user.deckHueRotation,
      } as IRoomPlayer,
    });
    setLocalPlayerSettings({
      deckVariantIndex: user.deckVariantIndex,
      squeakPileOnLeft: user.squeakPileOnLeft,
      desktopNotifications: user.desktopNotifications,
    });
  }, [
    user,
    userID,
    localPlayerMetadata,
    localPlayerSettings,
    setLocalPlayerMetadata,
    setLocalPlayerSettings,
  ]); // TODO: I hope this isn't a problem, but check if adding the setters as a dependency causes any issues

  useEffect(() => {
    if (user === undefined || user === null) return;

    if (
      (localPlayerMetadata[userID]?.username !== user.username &&
        localPlayerMetadata[userID]?.username.length !== 0) ||
      localPlayerMetadata[userID]?.avatarPath !== user.avatarPath ||
      localPlayerMetadata[userID]?.color !== user.color ||
      localPlayerMetadata[userID]?.deckHueRotation !== user.deckHueRotation ||
      localPlayerSettings.deckVariantIndex !== user.deckVariantIndex ||
      localPlayerSettings.squeakPileOnLeft !== user.squeakPileOnLeft ||
      localPlayerSettings.desktopNotifications !== user.desktopNotifications
    ) {
      setAbleToSave(true);
      return;
    }

    setAbleToSave(false);
  }, [localPlayerMetadata, userID, user, localPlayerSettings]);

  function updateUserHandler() {
    const updatedMetadata = localPlayerMetadata[userID];
    if (user === undefined || user === null || updatedMetadata === undefined)
      return;

    updateUser.mutate({
      userId: userID,
      username: updatedMetadata.username,
      avatarPath: updatedMetadata.avatarPath,
      color: updatedMetadata.color,
      deckHueRotation: updatedMetadata.deckHueRotation,
      deckVariantIndex: localPlayerSettings.deckVariantIndex,
      squeakPileOnLeft: localPlayerSettings.squeakPileOnLeft,
      desktopNotifications: localPlayerSettings.desktopNotifications,
    });

    setMirrorPlayerContainer(!localPlayerSettings.squeakPileOnLeft);

    // cannot update while connected to room because it could show incorrect/out of date
    // metadata compared to what the server has
    if (!connectedToRoom) {
      setPlayerMetadata({
        ...playerMetadata,
        [userID]: {
          username: updatedMetadata.username,
          avatarPath: updatedMetadata.avatarPath,
          color: updatedMetadata.color,
          deckHueRotation: updatedMetadata.deckHueRotation,
        },
      });
    }

    // Reset the ableToSave state after the user is updated
    setAbleToSave(false);
  }

  const [focusedInInput, setFocusedInInput] = useState<boolean>(false);

  return (
    <>
      <div className="absolute left-0 top-0 z-10 h-8 w-full bg-zinc-200">
        <Button
          variant={"ghost"}
          onClick={() => setRenderedView(undefined)}
          className="baseFlex absolute left-2 top-0 gap-2 !p-0"
        >
          <IoIosArrowForward size={"1rem"} className="rotate-180" />
          Back
        </Button>
      </div>

      <div className="baseVertFlex h-full w-full !justify-start overflow-y-auto">
        <div className="baseFlex mb-4 mt-16 gap-2">
          <Label>Username</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="username"
              className="!ring-offset-white focus-visible:ring-2"
              maxLength={16}
              onFocus={() => setFocusedInInput(true)}
              onBlur={() => setFocusedInInput(false)}
              onChange={(e) => {
                setUsernameIsProfane(filter.isProfane(e.target.value));

                setLocalPlayerMetadata((prevMetadata) => ({
                  ...prevMetadata,
                  [userID]: {
                    ...prevMetadata?.[userID],
                    username: e.target.value,
                  } as IRoomPlayer,
                }));
              }}
              value={localPlayerMetadata[userID]?.username}
            />

            <div
              style={{
                opacity:
                  focusedInInput ||
                  localPlayerMetadata[userID]?.username?.length === 0
                    ? 1
                    : 0,
              }}
              className="absolute right-1 top-0 text-xl text-red-600 transition-opacity"
            >
              *
            </div>

            <AnimatePresence>
              {usernameIsProfane && (
                <motion.div
                  key={"settingsProfanityWarning"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  // TODO: for w/e reason seems like you need to put z-index of avatar/front/back
                  // to -1 so that this can be visible... something else is probably off
                  className="baseVertFlex absolute -right-2 top-11 z-[200] whitespace-nowrap rounded-md border-2 border-red-700 bg-green-700 px-4 py-2 text-sm text-lightGreen shadow-md tablet:right-[-255px] tablet:top-0"
                >
                  <div>Username not allowed,</div>
                  <div className="text-center">please choose another one</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="baseVertFlex h-full w-screen">
          {settingsViewLabels.map((label) => (
            <Button
              key={label}
              variant="drawer"
              style={{
                borderBottomWidth: label === "back" ? "1px" : "0px",
              }}
              showArrow
              className="baseFlex h-24 w-full !justify-start border-t-[1px]"
              onClick={() => setRenderedView(label)}
            >
              <motion.div
                key={`${label}PickerPreview`}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.15 }}
                className="baseFlex color-lightGreen h-[96px] cursor-pointer gap-4 border-darkGreen"
              >
                <PlayerCustomizationPreview
                  renderedView={label}
                  forDrawer
                  useDarkerFont
                  transparentAvatarBackground
                  localPlayerMetadata={localPlayerMetadata}
                />
              </motion.div>
            </Button>
          ))}
        </div>

        <div
          style={{
            gridTemplateColumns: "minmax(204px, auto) auto",
          }}
          className="mt-4 grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="squeakPileOnLeft"
            className="self-center justify-self-start"
          >
            Show Squeak Pile on left
          </Label>
          <Switch
            id="squeakPileOnLeft"
            checked={localPlayerSettings.squeakPileOnLeft}
            onCheckedChange={() =>
              setLocalPlayerSettings((prevSettings) => ({
                ...prevSettings,
                squeakPileOnLeft: !prevSettings.squeakPileOnLeft,
              }))
            }
            className="self-center border-darkGreen"
          />
        </div>

        <div
          style={{
            gridTemplateColumns: "minmax(204px, auto) auto",
          }}
          className="my-4 grid grid-cols-2 items-center gap-4"
        >
          <Label
            htmlFor="enableDesktopNotifications"
            className="justify-self-start"
          >
            Enable mobile notifications
          </Label>
          <Switch
            id="enableDesktopNotifications"
            checked={localPlayerSettings.desktopNotifications}
            onCheckedChange={() => {
              Notification.requestPermission().then((result) => {
                if (result === "granted") {
                  setLocalPlayerSettings((prevSettings) => ({
                    ...prevSettings,
                    desktopNotifications: !prevSettings.desktopNotifications,
                  }));
                }
              });
            }}
            className="self-center border-darkGreen"
          />
        </div>

        <Button
          disabled={
            !ableToSave || usernameIsProfane || saveButtonText === "Saving"
          }
          onClick={() => {
            setSaveButtonText("Saving");
            updateUserHandler();
          }}
          className="my-4 h-[2.75rem] w-[10rem] !py-6"
        >
          <AnimatePresence mode={"popLayout"} initial={false}>
            <motion.div
              key={saveButtonText}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                duration: 0.25,
              }}
              className="baseFlex h-[2.75rem] w-[10rem] gap-2 !py-6"
            >
              {saveButtonText}
              {saveButtonText === "Save" && <IoSave size={"1.25rem"} />}
              {saveButtonText === "Saving" && (
                <div
                  className="inline-block size-4 animate-spin rounded-full border-[2px] border-darkGreen border-t-transparent text-darkGreen"
                  role="status"
                  aria-label="loading"
                >
                  <span className="sr-only">Loading...</span>
                </div>
              )}
              {saveButtonText === "Saved" && (
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-offwhite size-5"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      delay: 0.2,
                      type: "tween",
                      ease: "easeOut",
                      duration: 0.3,
                    }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      </div>
    </>
  );
}

const rowNames = [
  "Total Squeaks",
  "Average cards left in Squeak pile",
  "Average rank per round",
  "Highest score per round",
  "Total games played",
];

interface IFilteredStats {
  squeaks: number;
  avgPlace: number;
  avgLeftInSqueak: number;
  highestScore: number;
  totalGamesPlayed: number;
}

interface IDrawerStatistics {
  setRenderedView: React.Dispatch<
    React.SetStateAction<allViewLabels | undefined>
  >;
}

function DrawerStatistics({ setRenderedView }: IDrawerStatistics) {
  const userID = useUserIDContext();

  const { data: userStats } = api.stats.getStatsByID.useQuery(userID);

  const [filteredStats, setFilteredStats] = useState<IFilteredStats>();

  useEffect(() => {
    if (userStats && filteredStats === undefined) {
      const filteredStats: IFilteredStats = {
        squeaks: userStats.squeaks,
        avgPlace: userStats.averageFinishingPlace,
        avgLeftInSqueak: userStats.averageLeftInSqueak,
        highestScore: userStats.highestScore,
        totalGamesPlayed: userStats.totalGamesPlayed,
      };

      setTimeout(() => {
        setFilteredStats(filteredStats);
      }, 1000);
    }
  }, [userStats, filteredStats]);

  return (
    <>
      <div className="absolute left-0 top-0 z-10 h-8 w-full bg-zinc-200">
        <Button
          variant={"ghost"}
          onClick={() => setRenderedView(undefined)}
          className="baseFlex absolute left-2 top-0 gap-2 !p-0"
        >
          <IoIosArrowForward size={"1rem"} className="rotate-180" />
          Back
        </Button>
      </div>

      <p className="text-lg font-medium underline underline-offset-2">Stats</p>

      <div className="baseVertFlex color-darkGreen m-4 mt-8 gap-6 rounded-md border-2 border-darkGreen p-4">
        {rowNames.map((rowName, index) => (
          <div key={index} className="baseFlex w-full !justify-between gap-8">
            <div className="font-semibold">{rowName}</div>

            <div className="w-16 text-right">
              <AnimatePresence mode="wait">
                {filteredStats ? (
                  <motion.div
                    key={`filteredStats${rowName}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-semibold"
                  >
                    {Object.values(filteredStats)[index]}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`loadingSpinner${rowName}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-block size-4 animate-spin rounded-full border-[2px] border-darkGreen border-t-transparent text-darkGreen"
                    role="status"
                    aria-label="loading"
                  >
                    <span className="sr-only">Loading...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

interface IDrawerFriendsList {
  setRenderedView: React.Dispatch<
    React.SetStateAction<allViewLabels | undefined>
  >;
  setFriendBeingViewed: React.Dispatch<React.SetStateAction<User | null>>;
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
}

function DrawerFriendsList({
  setRenderedView,
  setFriendBeingViewed,
  setShowDrawer,
}: IDrawerFriendsList) {
  const userID = useUserIDContext();
  const { push } = useRouter();

  const {
    playerMetadata,
    connectedToRoom,
    friendData,
    newInviteNotification,
    setNewInviteNotification,
    roomConfig,
    setConnectedToRoom,
  } = useRoomContext();

  // TODO: fix ergonomics around these queries. Currently can't fully disable
  // queries based on friendData being undefined, since jsx below will infinitely
  // render loading spinners

  const { data: friends } = api.users.getUsersFromIDList.useQuery(
    friendData?.friendIDs ?? [],
    // {
    //   enabled: Boolean(
    //     (friendData?.friendIDs ? friendData.friendIDs.length : 0) > 0,
    //   ),
    // },
  );
  const { data: friendInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.friendInviteIDs ?? [],
    // {
    //   enabled: Boolean(
    //     (friendData?.friendInviteIDs ? friendData.friendInviteIDs.length : 0) >
    //       0,
    //   ),
    // },
  );
  const { data: roomInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.roomInviteIDs ?? [],
    // {
    //   enabled: Boolean(
    //     (friendData?.roomInviteIDs ? friendData.roomInviteIDs.length : 0) > 0,
    //   ),
    // },
  );

  useEffect(() => {
    // clears red notification dot if it exists
    if (newInviteNotification) {
      setNewInviteNotification(false);
    }
  }, [newInviteNotification, setNewInviteNotification]);

  return (
    <>
      <div className="absolute left-0 top-0 z-10 h-8 w-full bg-zinc-200">
        <Button
          variant={"ghost"}
          onClick={() => setRenderedView(undefined)}
          className="baseFlex absolute left-2 top-0 gap-2 !p-0"
        >
          <IoIosArrowForward size={"1rem"} className="rotate-180" />
          Back
        </Button>
      </div>

      <div className="baseVertFlex h-full w-11/12 max-w-[500px] !items-start !justify-start gap-2 overflow-y-auto pb-4 pt-12">
        <div className="baseVertFlex w-full !items-start gap-2">
          <div className="baseFlex mb-4 gap-2 border-b-2 border-darkGreen text-xl text-darkGreen">
            <FiMail size={"1.5rem"} />
            <div className="baseFlex gap-2">
              Pending
              <div className="baseFlex gap-[0.1rem]">
                <div>(</div>
                <div>
                  {friendInviteIDs && roomInviteIDs
                    ? friendInviteIDs.length + roomInviteIDs.length
                    : 0}
                </div>
                <div>)</div>
              </div>
            </div>
          </div>
          {friendInviteIDs ? (
            <div
              style={{
                padding: friendInviteIDs.length > 0 ? "0.5rem" : "0",
              }}
              className="baseVertFlex w-full !items-start !justify-start gap-4 overflow-auto"
            >
              {friendInviteIDs.map((friend, index) => (
                <div
                  key={friend.id}
                  style={{
                    zIndex: friendInviteIDs.length - index,
                  }}
                  className="baseFlex color-darkGreen w-full !justify-between gap-4"
                >
                  <div className="baseFlex gap-4">
                    <PlayerIcon
                      avatarPath={friend.avatarPath}
                      borderColor={friend.color}
                      size={"2.5rem"}
                      transparentBackground
                    />
                    <div className="baseVertFlex !items-start font-semibold">
                      {friend.username}
                      <div className="text-sm opacity-80">friend invite</div>
                    </div>
                  </div>
                  <div className="baseFlex gap-[0.75rem]">
                    <Button
                      variant={"secondary"}
                      onClick={() =>
                        socket.emit("modifyFriendData", {
                          action: "acceptFriendInvite",
                          initiatorID: userID,
                          targetID: friend.id,
                        })
                      }
                      className="gap-2 !p-2"
                    >
                      <AiOutlineCheck size={"1.25rem"} />
                    </Button>

                    <Button
                      variant={"destructive"}
                      onClick={() =>
                        socket.emit("modifyFriendData", {
                          action: "declineFriendInvite",
                          initiatorID: userID,
                          targetID: friend.id,
                        })
                      }
                      className="gap-2 !p-2"
                    >
                      <AiOutlineClose size={"1.25rem"} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="baseFlex w-full">
              <div
                className="inline-block size-10 animate-spin rounded-full border-[2px] border-darkGreen border-t-transparent text-darkGreen"
                role="status"
                aria-label="loading"
              >
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          {/* gating render until friendIDs appear so that it doesn't show loading circle
            and the roomInvites at the same time */}
          {friendInviteIDs &&
            roomInviteIDs &&
            roomInviteIDs.map((friend, index) => (
              <div
                key={friend.id}
                style={{
                  zIndex: roomInviteIDs.length - index,
                }}
                className="baseFlex color-darkGreen w-full !justify-between gap-4 p-2"
              >
                <div className="baseFlex gap-4 pl-2">
                  <TbDoorEnter size={"2rem"} />
                  <div className="baseVertFlex !items-start font-semibold">
                    {friend.username}
                    <div className="text-sm opacity-80">room invite</div>
                  </div>
                </div>
                <div className="baseFlex gap-[0.75rem]">
                  <Button
                    variant={"secondary"}
                    onClick={() => {
                      // there are probably major redundancies here, but should work for now

                      const roomCodeOfRoomBeingJoined = friend.roomCode;

                      // if player has invite(s) to this room, remove them
                      for (const friend of roomInviteIDs) {
                        if (friend.roomCode === roomCodeOfRoomBeingJoined) {
                          socket.emit("modifyFriendData", {
                            action: "acceptRoomInvite",
                            initiatorID: userID,
                            targetID: friend.id,
                            roomCode: friend.roomCode,
                            currentRoomIsPublic: friend.currentRoomIsPublic,
                          });
                        }
                      }

                      if (connectedToRoom) {
                        socket.emit("leaveRoom", {
                          roomCode: roomConfig.code,
                          userID,
                          playerWasKicked: false,
                        });
                      }

                      push(`/join/${roomCodeOfRoomBeingJoined}`);

                      socket.emit("modifyFriendData", {
                        action: "joinRoom",
                        initiatorID: userID,
                        roomCode: friend.roomCode,
                        currentRoomIsPublic: friend.currentRoomIsPublic,
                      });

                      socket.emit("joinRoom", {
                        userID,
                        code: friend.roomCode,
                        playerMetadata: playerMetadata[userID],
                      });

                      setConnectedToRoom(true);

                      setShowDrawer(false);
                    }}
                    className="gap-2 !p-2"
                  >
                    <AiOutlineCheck size={"1.25rem"} />
                  </Button>

                  <Button
                    variant={"destructive"}
                    onClick={() =>
                      socket.emit("modifyFriendData", {
                        action: "declineRoomInvite",
                        initiatorID: userID,
                        targetID: friend.id,
                      })
                    }
                    className="gap-2 !p-2"
                  >
                    <AiOutlineClose size={"1.25rem"} />
                  </Button>
                </div>
              </div>
            ))}
        </div>

        <div className="baseVertFlex w-full !items-start gap-2">
          <div className="baseFlex color-darkGreen mt-4 gap-2 border-b-2 border-darkGreen text-xl">
            <FaUserFriends size={"1.5rem"} />
            <div className="baseFlex text-darkGren gap-2">
              Friends
              {friends !== undefined && (
                <div className="baseFlex gap-[0.1rem]">
                  <div>(</div>
                  <div>{friends.length}</div>
                  <div>)</div>
                </div>
              )}
            </div>
          </div>
          {friends ? (
            <div className="baseVertFlex w-full !items-start !justify-start gap-4">
              {friends
                .sort(
                  ({ online: onlineA = false }, { online: onlineB = false }) =>
                    Number(onlineB) - Number(onlineA),
                )
                .map((friend, index) => (
                  <Button
                    key={friend.id}
                    variant={"drawer"}
                    style={{
                      zIndex: friends.length - index,
                    }}
                    className="baseFlex !h-24 !justify-start gap-2 !rounded-md border-2 transition-all"
                    onClick={() => {
                      setRenderedView("Friend actions");
                      setFriendBeingViewed(friend);
                    }}
                  >
                    <div className="baseFlex gap-4">
                      <PlayerIcon
                        avatarPath={friend.avatarPath}
                        borderColor={friend.color}
                        size={"2.5rem"}
                        onlineStatus={friend.online}
                        transparentBackground
                      />
                      <div className="baseVertFlex !items-start text-darkGreen">
                        {friend.username}
                        {friend.online && (
                          <div className="text-sm opacity-80">
                            {friend.status}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
            </div>
          ) : (
            <div className="baseFlex w-full">
              <div
                className="inline-block size-10 animate-spin rounded-full border-[2px] border-darkGreen border-t-transparent text-darkGreen"
                role="status"
                aria-label="loading"
              >
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface IFriendActions {
  friend: User;
  setRenderedView: React.Dispatch<
    React.SetStateAction<allViewLabels | undefined>
  >;
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
}

function FriendActions({
  friend,
  setRenderedView,
  setShowDrawer,
}: IFriendActions) {
  const userID = useUserIDContext();
  const { push } = useRouter();

  const [sendInviteInnerText, setSendInviteInnerText] = useState("Send invite");
  const [buttonIsActive, setButtonIsActive] = useState(false);

  const { playerMetadata, connectedToRoom, roomConfig, setConnectedToRoom } =
    useRoomContext();

  return (
    <>
      <div className="absolute left-0 top-0 z-10 h-8 w-full bg-zinc-200">
        <Button
          variant={"ghost"}
          onClick={() => setRenderedView("Friends list")}
          className="baseFlex absolute left-2 top-0 gap-2 !p-0"
        >
          <IoIosArrowForward size={"1rem"} className="rotate-180" />
          Back
        </Button>
      </div>

      <div className="baseVertFlex w-full">
        <div className="baseFlex mb-4 gap-4">
          <PlayerIcon
            avatarPath={friend.avatarPath}
            borderColor={friend.color}
            size={"2.5rem"}
            onlineStatus={friend.online}
            transparentBackground
          />
          <div className="baseVertFlex !items-start text-darkGreen">
            {friend.username}
            {friend.online && (
              <div className="text-sm opacity-80">{friend.status}</div>
            )}
          </div>
        </div>

        <Button
          variant="drawer"
          disabled={
            !friend.online ||
            friend.status === "in a game" ||
            !connectedToRoom ||
            friend.roomCode === roomConfig.code
          }
          showArrow={false}
          showCheckmark={sendInviteInnerText === "Invite sent!"}
          className="h-16 border-t-[1px]"
          onClick={() => {
            socket.emit("modifyFriendData", {
              action: "sendRoomInvite",
              initiatorID: userID,
              targetID: friend.id,
            });
            setSendInviteInnerText("Invite sent!");
            setTimeout(() => {
              setSendInviteInnerText("Send invite");
            }, 1000);
          }}
        >
          <div className="baseFlex w-full gap-4">
            <FiMail size={"1.5rem"} />
            <span>{sendInviteInnerText}</span>
          </div>
        </Button>

        <Button
          variant="drawer"
          disabled={
            !friend.online ||
            friend.roomCode === null ||
            friend.roomCode === roomConfig.code ||
            friend.status === "in a game" ||
            !friend.currentRoomIsPublic ||
            friend.currentRoomIsFull === true
          }
          showArrow={false}
          className="h-16 border-t-[1px]"
          onClick={() => {
            if (connectedToRoom) {
              socket.emit("leaveRoom", {
                roomCode: roomConfig.code,
                userID,
                playerWasKicked: false,
              });
            }

            push(`/join/${friend.roomCode}`);

            socket.emit("modifyFriendData", {
              action: "joinRoom",
              initiatorID: userID,
              roomCode: friend.roomCode,
              currentRoomIsPublic: friend.currentRoomIsPublic,
            });

            socket.emit("joinRoom", {
              userID,
              code: friend.roomCode,
              playerMetadata: playerMetadata[userID],
            });

            setConnectedToRoom(true);

            setShowDrawer(false);
          }}
        >
          <div className="baseFlex w-full gap-4">
            <TbDoorEnter size={"1.5rem"} />
            <span>Join room</span>
          </div>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="drawer"
              showArrow={false}
              style={{
                borderColor: buttonIsActive
                  ? "hsl(0, 84%, 50%)"
                  : "hsl(0, 84%, 60%)",
                backgroundColor: buttonIsActive
                  ? "hsl(0, 84%, 50%)"
                  : "hsl(0, 84%, 95%)",
                color: buttonIsActive ? "hsl(0, 84%, 80%)" : "hsl(0, 84%, 40%)",
                filter: `brightness(${buttonIsActive ? "0.75" : "1"})`,
              }}
              className="h-16 border-t-[1px]"
              onPointerDown={() => setButtonIsActive(true)}
              onPointerUp={() => setButtonIsActive(false)}
              onPointerLeave={() => setButtonIsActive(false)}
            >
              <div className="baseFlex gap-4">
                <FaTrashAlt size={"1.25rem"} />
                <span>Remove friend</span>
              </div>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm friend deletion?</AlertDialogTitle>
              <AlertDialogDescription>
                You won&apos;t be able to undo this action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="baseVertFlex gap-4">
              <AlertDialogCancel asChild>
                <Button variant={"secondary"} className="w-24">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant={"destructive"}
                  className="w-24"
                  onClick={() => {
                    socket.emit("modifyFriendData", {
                      action: "removeFriend",
                      initiatorID: userID,
                      targetID: friend.id,
                    });
                    setRenderedView("Friends list");
                  }}
                >
                  Confirm
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}

interface IWhilePlayingDrawer {
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  leaveRoom: () => void;
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: React.Dispatch<React.SetStateAction<boolean>>;
}

function WhilePlayingDrawer({
  setShowDrawer,
  leaveRoom,
  showVotingOptionButtons,
  setShowVotingOptionButtons,
}: IWhilePlayingDrawer) {
  return (
    <div className="baseVertFlex w-full">
      <div className="baseVertFlex w-full !items-start gap-2 border-darkGreen px-2 py-4">
        <Label className="pl-1 text-base">Volume</Label>
        <AudioLevelSlider forMobile />
      </div>

      <div className="baseVertFlex w-full !items-start gap-2 border-t-[1px] border-darkGreen px-2 py-4">
        <Label className="pl-1 text-base">Voting</Label>
        <VotingModal
          showVotingOptionButtons={showVotingOptionButtons}
          setShowVotingOptionButtons={setShowVotingOptionButtons}
          setShowDrawer={setShowDrawer}
          forMobile
          forDrawer
        />
      </div>

      <div className="baseFlex w-full border-t-[1px] border-darkGreen px-2 py-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <TbDoorExit size={"1.5rem"} />
              Leave game
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader className="baseFlex w-full">
              <AlertDialogTitle className="w-64 sm:w-auto">
                Are you sure you want to leave the game?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter className="baseFlex mt-4 !flex-row gap-8">
              <AlertDialogCancel asChild>
                <Button variant={"secondary"} className="m-0 w-24">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant={"destructive"}
                  className="m-0 w-24"
                  onClick={() => {
                    setShowDrawer(false);
                    leaveRoom();
                  }}
                >
                  Confirm
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
