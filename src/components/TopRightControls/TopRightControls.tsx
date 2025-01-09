import React, { useState, useEffect, useRef, Fragment } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { useAuth } from "@clerk/nextjs";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../pages/api/socket";
import UserSettingsAndStatsDialog, {
  type ILocalPlayerSettings,
} from "../dialogs/SettingsAndStats/UserSettingsAndStatisticsDialog";
import { IoSettingsSharp } from "react-icons/io5";
import { TbDoorExit } from "react-icons/tb";
import { FaUserFriends } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
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
import AudioLevelSlider from "./AudioLevelSlider";
import useLeaveRoom from "../../hooks/useLeaveRoom";
import { MdHowToVote, MdQuestionMark } from "react-icons/md";
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
import { FaUsers } from "react-icons/fa";
import FriendsList from "../dialogs/FriendsList";
import { useRouter } from "next/router";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { FaForwardStep } from "react-icons/fa6";
import { Input } from "~/components/ui/input";
import { IoStatsChart } from "react-icons/io5";
import PlayerCustomizationPreview from "../playerIcons/PlayerCustomizationPreview";
import PlayerCustomizationPicker from "../playerIcons/PlayerCustomizationPicker";
import { useUserIDContext } from "~/context/UserIDContext";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { type User } from "@prisma/client";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { BsFillVolumeUpFill } from "react-icons/bs";
import DisconnectIcon from "~/components/ui/DisconnectIcon";
import {
  Sheet,
  SheetContent,
  SheetPortal,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  TbAntennaBarsOff,
  TbAntennaBars2,
  TbAntennaBars3,
  TbAntennaBars4,
  TbAntennaBars5,
} from "react-icons/tb";
import TutorialDialog from "~/components/dialogs/TutorialDialog";
import FriendsListSheet from "~/components/sheets/FriendsListSheet";

const obscenityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export type AllViewLabels =
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
  const { isSignedIn } = useAuth();
  const { route, asPath } = useRouter();
  const userID = useUserIDContext();

  const {
    showSettingsDialog,
    setShowSettingsDialog,
    newInviteNotification,
    voteType,
    votingIsLockedOut,
    showVotingDialog,
    setShowVotingDialog,
    showVotingOptionButtons,
    setShowVotingOptionButtons,
    viewportLabel,
    connectedToRoom,
    showSettingsSheet,
    setShowSettingsSheet,
  } = useRoomContext();

  const { data: user } = api.users.getUserByID.useQuery(userID, {
    enabled: isSignedIn && userID !== "",
  });

  const leaveRoom = useLeaveRoom({
    routeToNavigateTo: "/",
  });
  useVoteHasBeenCast();

  const [showFriendsList, setShowFriendsList] = useState<boolean>(false);
  const [voteWasStarted, setVoteWasStarted] = useState(false);
  const [showSettingsUnauthTooltip, setShowSettingsUnauthTooltip] =
    useState(false);
  const [showFriendsListUnauthTooltip, setShowFriendsListUnauthTooltip] =
    useState(false);
  const [showTutorialDialog, setShowTutorialDialog] = useState(false);

  useEffect(() => {
    if (
      window.innerWidth <= 1024 &&
      voteType !== null &&
      showVotingOptionButtons
    ) {
      toast.custom((t) => (
        <VotingDialogToast
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
      setShowVotingDialog(true);
    } else if (voteWasStarted && voteType === null) {
      setVoteWasStarted(false);
      setShowVotingDialog(false);

      setTimeout(() => {
        setShowVotingOptionButtons(true);
      }, 1000); // resetting this to true after the modal has finished animating out
    }
  }, [
    voteWasStarted,
    voteType,
    setShowVotingDialog,
    setShowVotingOptionButtons,
  ]);

  if (viewportLabel.includes("mobile")) {
    return (
      <Sheet
        open={showSettingsSheet}
        onOpenChange={(isOpen) => setShowSettingsSheet(isOpen)}
      >
        <div
          className={`baseFlex fixed right-2 !z-[150] h-8 w-8 ${
            !asPath.includes("/game") ? "top-3" : "top-1.5"
          }`}
        >
          <SheetTrigger
            aria-label="Settings"
            disabled={asPath.includes("/game") && !connectedToRoom}
            onClick={() => setShowSettingsSheet(true)}
          >
            <div className="baseFlex relative">
              <IoSettingsSharp
                className={`size-5 text-lightGreen transition-all duration-200 active:brightness-50 ${showSettingsSheet ? "rotate-[25deg]" : ""} ${viewportLabel === "mobile" && connectedToRoom && asPath.includes("/game") ? "opacity-0" : ""}`}
              />

              <AnimatePresence mode={"wait"}>
                {!asPath.includes("/game") && newInviteNotification && (
                  <motion.div
                    key={"friendsListInviteNotificationMobile"}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.25 }}
                    className="baseFlex absolute right-[-5px] top-[-5px] size-3"
                  >
                    <div
                      style={{
                        animationDuration: "2s",
                      }}
                      className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
                    ></div>
                    <div className="relative size-3 rounded-[50%] bg-red-600"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SheetTrigger>
        </div>
        <SheetPortal>
          <SheetContent
            style={{
              zIndex: 250,
            }}
            className="text-darkGreen"
          >
            {asPath.includes("/game") ? (
              <WhilePlayingSheet
                setShowSettingsSheet={setShowSettingsSheet}
                leaveRoom={leaveRoom}
                showVotingOptionButtons={showVotingOptionButtons}
                setShowVotingOptionButtons={setShowVotingOptionButtons}
              />
            ) : (
              <MainSheet
                user={user}
                setShowSettingsSheet={setShowSettingsSheet}
                newInviteNotification={newInviteNotification}
              />
            )}
          </SheetContent>
        </SheetPortal>
      </Sheet>
    );
  }

  return (
    <>
      <div
        style={{
          alignItems: !asPath.includes("/game") ? "flex-end" : "center",
        }}
        className={`${
          asPath.includes("/game") ? "baseFlex" : "baseVertFlex"
        } fixed right-1 top-1 z-[190] !min-w-fit gap-3 sm:gap-4 lg:right-4 lg:top-4`}
      >
        {!asPath.includes("/game") && (
          <div className="relative h-[40px] w-[40px] md:h-[44px] md:w-[44px]">
            <div
              onPointerEnter={() => {
                if (!isSignedIn) {
                  setShowSettingsUnauthTooltip(true);
                }
              }}
              onPointerLeave={() => {
                if (!isSignedIn) {
                  setShowSettingsUnauthTooltip(false);
                }
              }}
            >
              <TooltipProvider>
                <Tooltip open={showSettingsUnauthTooltip}>
                  <TooltipTrigger asChild>
                    {/* below is not ideal, but tooltip wouldn't show w/ Dialog being rendered */}
                    {isSignedIn ? (
                      <Dialog
                        open={showSettingsDialog}
                        onOpenChange={(isOpen) => setShowSettingsDialog(isOpen)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant={"secondary"}
                            disabled={!user}
                            includeMouseEvents
                            aria-label="Settings"
                            onClick={() => setShowSettingsDialog(true)}
                            className="h-[40px] w-[40px] md:h-[44px] md:w-[44px]"
                          >
                            <IoSettingsSharp size={"1.5rem"} />
                          </Button>
                        </DialogTrigger>

                        <UserSettingsAndStatsDialog
                          setShowDialog={setShowSettingsDialog}
                        />
                      </Dialog>
                    ) : (
                      <Button
                        variant={"secondary"}
                        disabled={!isSignedIn}
                        includeMouseEvents
                        aria-label="Settings"
                        onClick={() => setShowSettingsDialog(true)}
                        className="h-[40px] w-[40px] md:h-[44px] md:w-[44px]"
                      >
                        <IoSettingsSharp size={"1.5rem"} />
                      </Button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent
                    side={"left"}
                    sideOffset={8}
                    className="border-2 border-lightGreen bg-darkGreen text-lightGreen"
                  >
                    <p>Sign in to access</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        <AudioLevelSlider />

        {asPath.includes("/game") && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="secondary"
                  disabled={!connectedToRoom}
                  className="size-11 !shrink-0"
                >
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
                disabled={!connectedToRoom}
                onClick={() => setShowVotingDialog(true)}
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
                {showVotingDialog && (
                  <VotingDialog
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
              onPointerEnter={() => {
                if (!isSignedIn) {
                  setShowFriendsListUnauthTooltip(true);
                }
              }}
              onPointerLeave={() => {
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
                      disabled={!user}
                      includeMouseEvents
                      aria-label="Friends list"
                      className="absolute right-0 top-0 size-11"
                      onClick={() => setShowFriendsList(!showFriendsList)}
                    >
                      <FaUserFriends size={"1.5rem"} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side={"left"}
                    sideOffset={8}
                    className="border-2 border-lightGreen bg-darkGreen text-lightGreen"
                  >
                    <p>Sign in to access</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <AnimatePresence mode={"wait"}>
              {newInviteNotification && (
                <motion.div
                  key={"friendsListInviteNotification"}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                  className="baseFlex absolute right-[-5px] top-[-5px] size-4"
                >
                  <div
                    style={{
                      animationDuration: "2s",
                    }}
                    className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
                  ></div>
                  <div className="relative size-4 rounded-[50%] bg-red-600"></div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode={"wait"}>
              {showFriendsList && (
                <FriendsList setShowFriendsListDialog={setShowFriendsList} />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {route !== "/" && !viewportLabel.includes("mobile") && (
        <TooltipProvider>
          <Tooltip>
            <Dialog
              open={showTutorialDialog}
              onOpenChange={(isOpen) => setShowTutorialDialog(isOpen)}
            >
              <TooltipTrigger className="!absolute bottom-3 right-3 z-[500] text-lightGreen">
                <DialogTrigger asChild>
                  <Button
                    variant={"text"}
                    includeMouseEvents
                    onClick={() => setShowTutorialDialog(true)}
                    className="z-[500] size-[40px] !p-0"
                  >
                    <MdQuestionMark size={"1.5rem"} />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>

              <TooltipContent
                side={"right"}
                sideOffset={8}
                className="baseFlex z-[500] gap-2 rounded-md border-2 bg-gradient-to-br from-green-800 to-green-850 px-4 py-1 text-lightGreen"
              >
                <p>Rules</p>
              </TooltipContent>

              <TutorialDialog setShowDialog={setShowTutorialDialog} />
            </Dialog>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
}

export default TopRightControls;

interface IVotingDialog {
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSettingsSheet?: React.Dispatch<React.SetStateAction<boolean>>;
  forMobile?: boolean;
  forSheet?: boolean;
}

function VotingDialog({
  showVotingOptionButtons,
  setShowVotingOptionButtons,
  setShowSettingsSheet,
  forMobile,
  forSheet,
}: IVotingDialog) {
  const {
    roomConfig,
    playerMetadata,
    currentVotes,
    voteType,
    votingIsLockedOut,
    votingLockoutStartTimestamp,
    connectedToRoom,
  } = useRoomContext();

  const rotateDecksButtonRef = useRef<HTMLDivElement | null>(null);
  const endRoundButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      forSheet &&
      votingLockoutStartTimestamp &&
      rotateDecksButtonRef.current &&
      endRoundButtonRef.current
    ) {
      const elapsedSeconds = (Date.now() - votingLockoutStartTimestamp) / 1000;

      rotateDecksButtonRef.current!.style.animation = `timer 30s linear -${elapsedSeconds}s`;
      rotateDecksButtonRef.current!.style.animationPlayState = "running";

      endRoundButtonRef.current!.style.animation = `timer 30s linear -${elapsedSeconds}s`;
      endRoundButtonRef.current!.style.animationPlayState = "running";
    }
  }, [
    forSheet,
    votingLockoutStartTimestamp,
    endRoundButtonRef,
    rotateDecksButtonRef,
  ]);

  return (
    <motion.div
      key={"votingDialog"}
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
      className={`z-200 ${forSheet ? "" : "shadow-xl"} ${!forMobile ? "absolute right-0 top-0" : ""}`}
    >
      {/* voting modal */}
      <div
        className={`baseVertFlex rounded-md border-2 bg-darkGreen ${forSheet ? "border-darkGreen" : "border-lightGreen"} `}
      >
        <div
          className={`baseFlex w-full gap-4 bg-lightGreen px-4 py-2 text-darkGreen ${
            forSheet ? "rounded-sm" : ""
          }`}
        >
          <AnimatePresence mode="wait">
            {voteType !== null && (
              <motion.div
                key={"votingDialogProgressRing"}
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
              {voteType === "rotateDecks" ? "Rotate decks?" : "End the round?"}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {voteType !== null && (
            <motion.div
              key={"votingDialogVoteCount"}
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
              key={"votingDialogVoteButtons"}
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
              className="baseFlex w-full px-3 xs:px-4"
            >
              {voteType === null ? (
                <div className="baseFlex w-full gap-2 xs:gap-4 tablet:!flex-col">
                  <div className="relative h-12 w-full">
                    <Button
                      variant={"secondary"}
                      disabled={!connectedToRoom}
                      onClick={() => {
                        setShowVotingOptionButtons(false);

                        toast.dismiss();
                        setShowSettingsSheet?.(false);

                        socket.emit("castVote", {
                          roomCode: roomConfig.code,
                          voteType: "rotateDecks",
                          voteDirection: "for",
                        });
                      }}
                      className="absolute left-0 top-0 h-12 w-full gap-[0.8rem] text-sm"
                    >
                      Rotate decks
                      <FaArrowsRotate className="size-4" />
                    </Button>

                    {votingIsLockedOut && (
                      <motion.div
                        key={"rotateDecksCooldownTimer"}
                        ref={rotateDecksButtonRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="sheetCooldownVoteTimer absolute right-0 top-0"
                      ></motion.div>
                    )}
                  </div>

                  <div className="relative h-12 w-full">
                    <Button
                      variant={"secondary"}
                      disabled={!connectedToRoom}
                      onClick={() => {
                        setShowVotingOptionButtons(false);

                        toast.dismiss();
                        setShowSettingsSheet?.(false);

                        socket.emit("castVote", {
                          roomCode: roomConfig.code,
                          voteType: "endRound",
                          voteDirection: "for",
                        });
                      }}
                      className="absolute left-0 top-0 h-12 w-full gap-[0.8rem] whitespace-nowrap text-sm"
                    >
                      End the round
                      <FaForwardStep className="size-4" />
                    </Button>

                    {votingIsLockedOut && (
                      <motion.div
                        key={"endRoundCooldownTimer"}
                        ref={endRoundButtonRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="sheetCooldownVoteTimer absolute right-0 top-0"
                      ></motion.div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="baseFlex w-full gap-2">
                  <Button
                    variant={"secondary"}
                    disabled={!connectedToRoom}
                    onClick={() => {
                      setShowVotingOptionButtons(false);

                      toast.dismiss();
                      setShowSettingsSheet?.(false);

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
                    disabled={!connectedToRoom}
                    onClick={() => {
                      setShowVotingOptionButtons(false);

                      toast.dismiss();
                      setShowSettingsSheet?.(false);

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

interface IVotingDialogToast {
  isVisible: boolean;
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: React.Dispatch<React.SetStateAction<boolean>>;
}

// needed to extract this to custom component because the exit animations weren't working on the toast
function VotingDialogToast({
  isVisible,
  showVotingOptionButtons,
  setShowVotingOptionButtons,
}: IVotingDialogToast) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={"votingDialogToast"}
          initial={{ opacity: 0, translateY: "-100%" }}
          animate={{ opacity: 1, translateY: "0%" }}
          exit={{ opacity: 0, translateY: "-100%" }}
          transition={{
            opacity: { duration: 0.15 },
            translateY: { duration: 0.35 },
          }}
          className={`baseFlex pointer-events-auto h-full w-full max-w-96 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5`}
        >
          <VotingDialog
            showVotingOptionButtons={showVotingOptionButtons}
            setShowVotingOptionButtons={setShowVotingOptionButtons}
            forMobile
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface IMainSheet {
  user: User | undefined | null;
  setShowSettingsSheet: React.Dispatch<React.SetStateAction<boolean>>;
  newInviteNotification: boolean;
}

function MainSheet({
  user,
  setShowSettingsSheet,
  newInviteNotification,
}: IMainSheet) {
  const { signOut } = useAuth();

  const [renderedView, setRenderedView] = useState<AllViewLabels | undefined>();

  const [localPlayerMetadata, setLocalPlayerMetadata] =
    useState<IRoomPlayersMetadata>({} as IRoomPlayersMetadata);
  const [localPlayerSettings, setLocalPlayerSettings] =
    useState<ILocalPlayerSettings>({} as ILocalPlayerSettings);

  function getSheetHeight() {
    switch (renderedView) {
      case "Settings":
        return "500px";
      case "Statistics":
        return "405px";
      case "Friends list":
        return "500px";
      case "Friend actions":
        return "280px";
      case "avatar":
        return "365px";
      case "front":
        return "240px";
      case "back":
        return "430px";
      default:
        return "388px";
    }
  }

  return (
    <div
      style={{
        height: getSheetHeight(),
        transition: "height 0.3s ease-in-out",
      }}
      className="baseVertFlex w-full"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {renderedView === undefined && (
          <motion.div
            key="mainSheetTopButtons"
            initial={{ opacity: 0, translateX: "-100%" }}
            animate={{ opacity: 1, translateX: "0%" }}
            exit={{ opacity: 0, translateX: "-100%" }}
            transition={{
              duration: 0.3,
            }}
            className="baseVertFlex w-full"
          >
            {mainViewLabels.map((label) => (
              <Button
                key={label}
                variant={"sheet"}
                disabled={!user}
                style={{
                  borderTopWidth: label === "Settings" ? "0px" : "1px",
                }}
                showArrow
                className="baseFlex relative h-20 w-full !justify-start"
                onClick={() => setRenderedView(label)}
              >
                <div className="baseFlex gap-4 text-lg font-semibold">
                  {label === "Settings" && <IoSettingsSharp size={"1.5rem"} />}
                  {label === "Statistics" && <IoStatsChart size={"1.5rem"} />}
                  {label === "Friends list" && (
                    <FaUserFriends size={"1.5rem"} />
                  )}
                  {label}
                  {label === "Friends list" && newInviteNotification && (
                    <AnimatePresence mode={"wait"}>
                      {newInviteNotification && (
                        <motion.div
                          key={"friendsListInviteNotificationMobile"}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.25 }}
                          className="baseFlex size-3"
                        >
                          <div
                            style={{
                              animationDuration: "2s",
                            }}
                            className="absolute inline-flex size-3 animate-ping rounded-full bg-red-500 opacity-75"
                          ></div>
                          <div className="relative size-3 rounded-[50%] bg-red-600"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </Button>
            ))}

            <div className="baseVertFlex w-full !items-start gap-2 border-y-[1px] border-darkGreen px-2 py-4">
              <Label className="pl-1">Volume</Label>
              <AudioLevelSlider forMobile />
            </div>

            <div className="baseFlex my-2 h-8 w-full max-w-sm !justify-around">
              {user && (
                <Button
                  variant={"text"}
                  onClick={() => {
                    setShowSettingsSheet(false);
                    signOut();
                  }}
                  className="h-8 !px-0 !py-0 text-darkGreen underline underline-offset-4"
                >
                  Log out
                </Button>
              )}

              <div className="baseFlex !flex-nowrap gap-1.5 text-sm">
                Made by
                <a
                  href="https://github.com/michaelongaro"
                  target="_blank"
                  rel="noreferrer"
                  className="baseFlex !items-end gap-1 underline underline-offset-4"
                >
                  Michael Ongaro
                  <HiExternalLink size={"1rem"} />
                </a>
              </div>
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
              "baseVertFlex color-darkGreen relative h-full w-full bg-zinc-200"
            }
          >
            {renderedView === "Settings" && (
              <SheetSettings
                setRenderedView={setRenderedView}
                localPlayerMetadata={localPlayerMetadata}
                setLocalPlayerMetadata={setLocalPlayerMetadata}
                localPlayerSettings={localPlayerSettings}
                setLocalPlayerSettings={setLocalPlayerSettings}
              />
            )}

            {renderedView === "Statistics" && (
              <SheetStatistics setRenderedView={setRenderedView} />
            )}

            {renderedView === "Friends list" && (
              <FriendsListSheet setRenderedView={setRenderedView} />
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
            className={"baseVertFlex relative h-full w-full bg-zinc-200"}
          >
            <div className="absolute left-0 top-0 z-10 h-8 w-full bg-zinc-200">
              <Button
                variant={"text"}
                onClick={() => setRenderedView("Settings")}
                className="baseFlex !absolute left-2 top-0 gap-2 !p-0 text-darkGreen"
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
              forSheet
              localPlayerMetadata={localPlayerMetadata}
              setLocalPlayerMetadata={setLocalPlayerMetadata}
              setLocalPlayerSettings={setLocalPlayerSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ISheetSettings {
  localPlayerMetadata: IRoomPlayersMetadata;
  setLocalPlayerMetadata: React.Dispatch<
    React.SetStateAction<IRoomPlayersMetadata>
  >;
  localPlayerSettings: ILocalPlayerSettings;
  setLocalPlayerSettings: React.Dispatch<
    React.SetStateAction<ILocalPlayerSettings>
  >;
  setRenderedView: React.Dispatch<
    React.SetStateAction<AllViewLabels | undefined>
  >;
}

function SheetSettings({
  localPlayerMetadata,
  localPlayerSettings,
  setLocalPlayerMetadata,
  setLocalPlayerSettings,
  setRenderedView,
}: ISheetSettings) {
  const userID = useUserIDContext();
  const { signOut } = useAuth();

  const {
    playerMetadata,
    setPlayerMetadata,
    connectedToRoom,
    setMirrorPlayerContainer,
  } = useRoomContext();

  const utils = api.useUtils();
  const { data: user } = api.users.getUserByID.useQuery(userID);
  const updateUser = api.users.updateUser.useMutation({
    onSettled: () => {
      setTimeout(() => {
        setSaveButtonText("Saved");

        utils.users.getUserByID.invalidate(userID);
        utils.users.getUsersFromIDList.invalidate();
        utils.users.getLeaderboardStats.invalidate();

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
      deckVariant: user.deckVariant,
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
  ]);

  useEffect(() => {
    if (user === undefined || user === null) return;

    if (
      (localPlayerMetadata[userID]?.username !== user.username &&
        localPlayerMetadata[userID]?.username.length !== 0) ||
      localPlayerMetadata[userID]?.avatarPath !== user.avatarPath ||
      localPlayerMetadata[userID]?.color !== user.color ||
      localPlayerMetadata[userID]?.deckHueRotation !== user.deckHueRotation ||
      localPlayerSettings.deckVariant !== user.deckVariant ||
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
      deckVariant: localPlayerSettings.deckVariant,
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

  const { mutate: deleteUser } = api.users.delete.useMutation({
    onSuccess: async () => {
      setTimeout(() => setDeleteButtonText("Account deleted"), 2000);

      setTimeout(() => {
        void signOut({ redirectUrl: "/" });
      }, 4000);
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [deleteButtonText, setDeleteButtonText] = useState("Delete account");

  const [focusedInInput, setFocusedInInput] = useState<boolean>(false);

  return (
    <>
      <div className="absolute left-0 top-0 z-10 h-8 w-full bg-zinc-200">
        <Button
          variant={"text"}
          onClick={() => setRenderedView(undefined)}
          className="baseFlex !absolute left-2 top-0 gap-2 !p-0 text-darkGreen"
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
              disabled={saveButtonText !== "Save"}
              type="text"
              placeholder="username"
              className="!ring-offset-white focus-visible:ring-2"
              maxLength={16}
              onFocus={() => setFocusedInInput(true)}
              onBlur={() => setFocusedInInput(false)}
              onChange={(e) => {
                setUsernameIsProfane(obscenityMatcher.hasMatch(e.target.value));

                setLocalPlayerMetadata((prevMetadata) => ({
                  ...prevMetadata,
                  [userID]: {
                    ...prevMetadata?.[userID],
                    username: e.target.value,
                  } as IRoomPlayer,
                }));
              }}
              value={localPlayerMetadata[userID]?.username || ""}
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
                  className="baseVertFlex absolute -right-2 top-11 z-[501] whitespace-nowrap rounded-md border-2 border-[hsl(0,84%,60%)] bg-gradient-to-br from-red-50 to-red-100 px-4 py-2 text-sm text-[hsl(0,84%,40%)] shadow-md tablet:right-[-255px] tablet:top-0"
                >
                  <div>Username not allowed,</div>
                  <div className="text-center">please choose another one</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div
          className={`baseVertFlex h-full w-full transition-opacity ${saveButtonText !== "Save" ? "opacity-50" : "opacity-100"}`}
        >
          {settingsViewLabels.map((label) => (
            <Button
              key={label}
              variant="sheet"
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
                  forSheet
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
            disabled={saveButtonText !== "Save"}
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
            disabled={saveButtonText !== "Save"}
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

        <div className="baseFlex my-4 w-full gap-4">
          <AlertDialog open={showDeleteUserDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant={"destructive"}
                disabled={saveButtonText !== "Save"}
                className={`baseFlex h-11 gap-2 text-destructive`}
                onClick={() => setShowDeleteUserDialog(true)}
              >
                Delete account
                <FaTrashAlt />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogTitle className="font-semibold">
                Delete account
              </AlertDialogTitle>

              <AlertDialogDescription className="baseVertFlex mb-8 gap-4">
                <p>
                  Are you sure you want to delete your account? This action is
                  <span className="font-semibold italic">
                    {" "}
                    irreversible
                  </span>{" "}
                  and all of your data will be lost.
                </p>
              </AlertDialogDescription>

              <AlertDialogFooter className="baseFlex w-full !flex-row !justify-between gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteUserDialog(false)}
                  className="!px-4"
                >
                  Cancel
                </Button>
                <Button
                  variant={"destructive"}
                  disabled={deleteButtonText !== "Delete account"}
                  onClick={() => {
                    setDeleteButtonText("Deleting account");
                    deleteUser(userID);
                  }}
                >
                  <AnimatePresence mode={"popLayout"} initial={false}>
                    <motion.div
                      key={deleteButtonText}
                      layout
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{
                        duration: 0.25,
                      }}
                      className="baseFlex gap-2"
                    >
                      {deleteButtonText}

                      {deleteButtonText === "Delete account" && <FaTrashAlt />}

                      {deleteButtonText === "Deleting account" && (
                        <div
                          className="text-offwhite inline-block size-4 animate-spin rounded-full border-[2px] border-white border-t-transparent"
                          role="status"
                          aria-label="loading"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      )}
                      {deleteButtonText === "Account deleted" && (
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="text-offwhite size-4"
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
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant={"outline"}
            disabled={
              !ableToSave || usernameIsProfane || saveButtonText === "Saving"
            }
            onClick={() => {
              setSaveButtonText("Saving");
              updateUserHandler();
            }}
            className="h-11 w-[10rem]"
          >
            <AnimatePresence mode={"popLayout"} initial={false}>
              <motion.div
                key={saveButtonText}
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

interface ISheetStatistics {
  setRenderedView: React.Dispatch<
    React.SetStateAction<AllViewLabels | undefined>
  >;
}

function SheetStatistics({ setRenderedView }: ISheetStatistics) {
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
          variant={"text"}
          onClick={() => setRenderedView(undefined)}
          className="baseFlex !absolute left-2 top-0 gap-2 !p-0 text-darkGreen"
        >
          <IoIosArrowForward size={"1rem"} className="rotate-180" />
          Back
        </Button>
      </div>

      <p className="text-lg font-medium underline underline-offset-2">
        Statistics
      </p>

      <div className="baseVertFlex m-4 mt-8 gap-3 rounded-md border-2 border-darkGreen p-4">
        {rowNames.map((rowName, index) => (
          <Fragment key={index}>
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

            <div className="h-[1px] w-full bg-darkGreen/70 last:hidden"></div>
          </Fragment>
        ))}
      </div>
    </>
  );
}

interface IWhilePlayingSheet {
  setShowSettingsSheet: React.Dispatch<React.SetStateAction<boolean>>;
  leaveRoom: () => void;
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: React.Dispatch<React.SetStateAction<boolean>>;
}

function WhilePlayingSheet({
  setShowSettingsSheet,
  leaveRoom,
  showVotingOptionButtons,
  setShowVotingOptionButtons,
}: IWhilePlayingSheet) {
  const { playerMetadata, roomConfig, gameData, playerPing } = useRoomContext();

  const [showTutorialDialog, setShowTutorialDialog] = useState(false);

  return (
    <div className="baseVertFlex h-[410px] w-full !justify-start overflow-y-auto">
      <div className="baseFlex absolute left-[9px] top-1.5 z-[500] gap-2 text-xs text-darkGreen">
        {playerPing === null && <TbAntennaBarsOff className="size-5" />}

        {playerPing !== null && playerPing < 50 && (
          <TbAntennaBars5 className="size-5" />
        )}

        {playerPing !== null && playerPing >= 50 && playerPing < 150 && (
          <TbAntennaBars4 className="size-5" />
        )}

        {playerPing !== null && playerPing >= 150 && playerPing < 300 && (
          <TbAntennaBars3 className="size-5" />
        )}

        {playerPing !== null && playerPing >= 300 && (
          <TbAntennaBars2 className="size-5" />
        )}

        <p>{playerPing === null ? "Offline" : `${playerPing} ms`}</p>
      </div>

      <div className="baseVertFlex w-full !items-start gap-2 border-darkGreen px-2 py-4">
        <Label className="baseFlex gap-2 pl-1 text-base">
          <BsFillVolumeUpFill className="size-5 shrink-0" />
          Volume
        </Label>
        <AudioLevelSlider forMobile />
      </div>

      <div className="baseVertFlex w-full !items-start gap-2 border-t-[1px] border-darkGreen px-2 py-4">
        <Label className="baseFlex gap-2 pl-1 text-base">
          <MdHowToVote className="size-5" />
          Voting
        </Label>
        <VotingDialog
          showVotingOptionButtons={showVotingOptionButtons}
          setShowVotingOptionButtons={setShowVotingOptionButtons}
          setShowSettingsSheet={setShowSettingsSheet}
          forMobile
          forSheet
        />
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="text-darkGreen">
          <AccordionTrigger>
            <Button
              variant={"sheet"}
              className="baseFlex !w-full !justify-start gap-2 border-t-[1px] border-darkGreen !py-4"
            >
              <FaUsers className="size-5" />
              Players
            </Button>
          </AccordionTrigger>
          <AccordionContent className="baseFlex w-full">
            <div
              style={{
                gridTemplateRows: "auto",
              }}
              className={`grid w-full max-w-sm grid-cols-2 !items-start !justify-start overflow-y-auto py-4 !text-darkGreen`}
            >
              {Object.keys(playerMetadata)?.map((playerID) => (
                <div className="relative" key={playerID}>
                  <div
                    style={{
                      opacity: gameData.playerIDsThatLeftMidgame.includes(
                        playerID,
                      )
                        ? 0.25
                        : 1,
                    }}
                  >
                    <PlayerIcon
                      avatarPath={
                        playerMetadata[playerID]?.avatarPath ||
                        "/avatars/rabbit.svg"
                      }
                      borderColor={
                        playerMetadata[playerID]?.color ||
                        "oklch(64.02% 0.171 15.38)"
                      }
                      playerID={playerID}
                      playerIsHost={playerID === roomConfig.hostUserID}
                      showAddFriendButton={false}
                      username={playerMetadata[playerID]?.username}
                      size={"3rem"}
                      playerMetadata={playerMetadata[playerID]}
                      forWhilePlayingSheet
                    />
                  </div>

                  {gameData.playerIDsThatLeftMidgame.includes(playerID) && (
                    <DisconnectIcon
                      darkGreenStroke
                      className="absolute left-1/2 top-[27%] size-8 -translate-x-1/2 -translate-y-1/2"
                    />
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="baseFlex w-full !justify-around border-t-[1px] border-darkGreen px-2 py-4">
        <Dialog
          open={showTutorialDialog}
          onOpenChange={(isOpen) => setShowTutorialDialog(isOpen)}
        >
          <DialogTrigger asChild>
            <Button
              variant={"outline"}
              onClick={() => setShowTutorialDialog(true)}
              className="baseFlex z-[500] gap-1"
            >
              <MdQuestionMark size={"1.35rem"} />
              Rules
            </Button>
          </DialogTrigger>

          <TutorialDialog setShowDialog={setShowTutorialDialog} />
        </Dialog>

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
                    setShowSettingsSheet(false);
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
