import React, { useState, useEffect, useRef } from "react";
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
} from "../dialogs/SettingsAndStats/UserSettingsAndStatsDialog";
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
import Filter from "bad-words";
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
  } = useRoomContext();

  const leaveRoom = useLeaveRoom({
    routeToNavigateTo: "/",
  });
  useVoteHasBeenCast();

  const [showFriendsList, setShowFriendsList] = useState<boolean>(false);

  const [voteWasStarted, setVoteWasStarted] = useState(false);

  const [showSheet, setShowSheet] = useState(false);

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
      <Sheet open={showSheet} onOpenChange={(isOpen) => setShowSheet(isOpen)}>
        <div
          className={`baseFlex fixed right-2 !z-[150] h-8 w-8 ${
            !asPath.includes("/game") ? "top-3" : "top-1.5"
          }`}
        >
          <SheetTrigger onClick={() => setShowSheet(true)}>
            <IoSettingsSharp
              className={`size-5 text-lightGreen transition-all duration-200 active:brightness-50 ${showSheet ? "rotate-[25deg]" : ""}`}
            />
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
                setShowSheet={setShowSheet}
                leaveRoom={leaveRoom}
                showVotingOptionButtons={showVotingOptionButtons}
                setShowVotingOptionButtons={setShowVotingOptionButtons}
              />
            ) : (
              <MainSheet
                status={
                  isLoaded
                    ? isSignedIn
                      ? "authenticated"
                      : "unauthenticated"
                    : "loading"
                }
                setShowSheet={setShowSheet}
              />
            )}
          </SheetContent>
        </SheetPortal>
      </Sheet>
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
                <Dialog
                  open={showSettingsDialog}
                  onOpenChange={(isOpen) => setShowSettingsDialog(isOpen)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant={"secondary"}
                      disabled={!isSignedIn}
                      includeMouseEvents
                      onClick={() => {
                        if (isSignedIn) {
                          setShowSettingsDialog(true);
                        }
                      }}
                      className="h-[40px] w-[40px] md:h-[44px] md:w-[44px]"
                    >
                      <IoSettingsSharp size={"1.5rem"} />
                    </Button>
                  </DialogTrigger>

                  <UserSettingsAndStatsDialog
                    setShowDialog={setShowSettingsDialog}
                  />
                </Dialog>
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
                    disabled={!isSignedIn}
                    includeMouseEvents
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
              <FriendsList setShowFriendsListDialog={setShowFriendsList} />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default TopRightControls;

interface IVotingDialog {
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSheet?: React.Dispatch<React.SetStateAction<boolean>>;
  forMobile?: boolean;
  forSheet?: boolean;
}

function VotingDialog({
  showVotingOptionButtons,
  setShowVotingOptionButtons,
  setShowSheet,
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
  } = useRoomContext();

  const rotateDecksButtonRef = useRef<HTMLDivElement | null>(null);
  const finishRoundButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      forSheet &&
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
    forSheet,
    votingLockoutStartTimestamp,
    finishRoundButtonRef,
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
      className={`z-200 ${!forMobile ? "absolute right-0 top-0" : ""}`}
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
              {voteType === "rotateDecks"
                ? "Rotate decks?"
                : "Finish the round?"}
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
                      onClick={() => {
                        setShowVotingOptionButtons(false);

                        toast.dismiss();
                        setShowSheet?.(false);

                        socket.volatile.emit("castVote", {
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
                      onClick={() => {
                        setShowVotingOptionButtons(false);

                        toast.dismiss();
                        setShowSheet?.(false);

                        socket.volatile.emit("castVote", {
                          roomCode: roomConfig.code,
                          voteType: "finishRound",
                          voteDirection: "for",
                        });
                      }}
                      className="absolute left-0 top-0 h-12 w-full gap-[0.8rem] whitespace-nowrap text-sm"
                    >
                      Finish the round
                      <FaForwardStep className="size-4" />
                    </Button>

                    {votingIsLockedOut && (
                      <motion.div
                        key={"finishRoundCooldownTimer"}
                        ref={finishRoundButtonRef}
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
                    onClick={() => {
                      setShowVotingOptionButtons(false);

                      toast.dismiss();
                      setShowSheet?.(false);

                      socket.volatile.emit("castVote", {
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
                      setShowSheet?.(false);

                      socket.volatile.emit("castVote", {
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
  status: "authenticated" | "loading" | "unauthenticated";
  setShowSheet: React.Dispatch<React.SetStateAction<boolean>>;
}

function MainSheet({ status, setShowSheet }: IMainSheet) {
  const { signOut } = useAuth();

  const [renderedView, setRenderedView] = useState<allViewLabels | undefined>();

  const [localPlayerMetadata, setLocalPlayerMetadata] =
    useState<IRoomPlayersMetadata>({} as IRoomPlayersMetadata);
  const [localPlayerSettings, setLocalPlayerSettings] =
    useState<ILocalPlayerSettings>({} as ILocalPlayerSettings);

  const [friendBeingViewed, setFriendBeingViewed] = useState<User | null>(null);

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

            <div className="baseFlex my-2 h-8 w-full max-w-sm !justify-around">
              {status === "authenticated" && (
                <Button
                  variant={"text"}
                  onClick={() => {
                    setShowSheet(false);
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
                  href="https://michaelongaro.com"
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
              <SheetFriendsList
                setRenderedView={setRenderedView}
                setFriendBeingViewed={setFriendBeingViewed}
                setShowSheet={setShowSheet}
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
              "baseVertFlex relative h-full w-full !justify-end bg-zinc-200"
            }
          >
            <FriendActions
              friend={friendBeingViewed}
              setRenderedView={setRenderedView}
              setShowSheet={setShowSheet}
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
    React.SetStateAction<allViewLabels | undefined>
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
                setUsernameIsProfane(filter.isProfane(e.target.value));

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

        <div className="baseFlex w-full gap-4">
          <AlertDialog open={showDeleteUserDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant={"destructive"}
                disabled={saveButtonText !== "Save"}
                className={`baseFlex h-12 gap-2 text-destructive`}
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
    React.SetStateAction<allViewLabels | undefined>
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

interface ISheetFriendsList {
  setRenderedView: React.Dispatch<
    React.SetStateAction<allViewLabels | undefined>
  >;
  setFriendBeingViewed: React.Dispatch<React.SetStateAction<User | null>>;
  setShowSheet: React.Dispatch<React.SetStateAction<boolean>>;
}

function SheetFriendsList({
  setRenderedView,
  setFriendBeingViewed,
  setShowSheet,
}: ISheetFriendsList) {
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
          variant={"text"}
          onClick={() => setRenderedView(undefined)}
          className="baseFlex !absolute left-2 top-0 gap-2 !p-0 text-darkGreen"
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
                        socket.volatile.emit("modifyFriendData", {
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
                        socket.volatile.emit("modifyFriendData", {
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
                          socket.volatile.emit("modifyFriendData", {
                            action: "acceptRoomInvite",
                            initiatorID: userID,
                            targetID: friend.id,
                            roomCode: friend.roomCode,
                            currentRoomIsPublic: friend.currentRoomIsPublic,
                          });
                        }
                      }

                      if (connectedToRoom) {
                        socket.volatile.emit("leaveRoom", {
                          roomCode: roomConfig.code,
                          userID,
                          playerWasKicked: false,
                        });
                      }

                      push(`/join/${roomCodeOfRoomBeingJoined}`);

                      socket.volatile.emit("modifyFriendData", {
                        action: "joinRoom",
                        initiatorID: userID,
                        roomCode: friend.roomCode,
                        currentRoomIsPublic: friend.currentRoomIsPublic,
                      });

                      socket.volatile.emit("joinRoom", {
                        userID,
                        code: friend.roomCode,
                        playerMetadata: playerMetadata[userID],
                      });

                      setConnectedToRoom(true);

                      setShowSheet(false);
                    }}
                    className="gap-2 !p-2"
                  >
                    <AiOutlineCheck size={"1.25rem"} />
                  </Button>

                  <Button
                    variant={"destructive"}
                    onClick={() =>
                      socket.volatile.emit("modifyFriendData", {
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
                    variant={"sheet"}
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
  setShowSheet: React.Dispatch<React.SetStateAction<boolean>>;
}

function FriendActions({
  friend,
  setRenderedView,
  setShowSheet,
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
          variant={"text"}
          onClick={() => setRenderedView("Friends list")}
          className="baseFlex !absolute left-2 top-0 gap-2 !p-0 text-darkGreen"
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
          variant="sheet"
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
            socket.volatile.emit("modifyFriendData", {
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
          variant="sheet"
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
              socket.volatile.emit("leaveRoom", {
                roomCode: roomConfig.code,
                userID,
                playerWasKicked: false,
              });
            }

            push(`/join/${friend.roomCode}`);

            socket.volatile.emit("modifyFriendData", {
              action: "joinRoom",
              initiatorID: userID,
              roomCode: friend.roomCode,
              currentRoomIsPublic: friend.currentRoomIsPublic,
            });

            socket.volatile.emit("joinRoom", {
              userID,
              code: friend.roomCode,
              playerMetadata: playerMetadata[userID],
            });

            setConnectedToRoom(true);

            setShowSheet(false);
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
              variant="sheet"
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
                    socket.volatile.emit("modifyFriendData", {
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

interface IWhilePlayingSheet {
  setShowSheet: React.Dispatch<React.SetStateAction<boolean>>;
  leaveRoom: () => void;
  showVotingOptionButtons: boolean;
  setShowVotingOptionButtons: React.Dispatch<React.SetStateAction<boolean>>;
}

function WhilePlayingSheet({
  setShowSheet,
  leaveRoom,
  showVotingOptionButtons,
  setShowVotingOptionButtons,
}: IWhilePlayingSheet) {
  const { playerMetadata, roomConfig, gameData, playerPing } = useRoomContext();

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
          setShowSheet={setShowSheet}
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
              className={`grid grid-cols-2 py-4 ${
                roomConfig.playersInRoom > 2 ? "grid-rows-2" : "grid-rows-1"
              } w-full max-w-sm !items-start !justify-start overflow-y-auto !text-darkGreen`}
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
                      className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2"
                    />
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
                    setShowSheet(false);
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
