import React, { useState, useEffect, useRef } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { useAuth, SignOutButton } from "@clerk/nextjs";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../pages/api/socket";
import SecondaryButton from "../Buttons/SecondaryButton";
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
import { MdSkipNext } from "react-icons/md";
import { FaArrowsRotate } from "react-icons/fa6";
import { IoIosCheckmark } from "react-icons/io";
import { IoClose, IoSave } from "react-icons/io5";
import useVoteReceived from "~/hooks/useVoteReceived";
import toast from "react-hot-toast";
import { HiExternalLink } from "react-icons/hi";
import { HiEllipsisHorizontal } from "react-icons/hi2";
import { IoIosArrowForward } from "react-icons/io";
import {
  Drawer,
  DrawerContent,
  DrawerPortal,
  DrawerTrigger,
} from "~/components/ui/drawer";
import FriendsList from "../modals/FriendsList";
import DangerButton from "../Buttons/DangerButton";
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
  useVoteReceived();

  const [showFriendsList, setShowFriendsList] = useState<boolean>(false);

  const [voteWasStarted, setVoteWasStarted] = useState(false);

  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    if (voteWasStarted && !showVotingOptionButtons && voteType === null) {
      setShowVotingOptionButtons(true);
    }
  }, [
    voteWasStarted,
    voteType,
    showVotingOptionButtons,
    setShowVotingOptionButtons,
  ]);

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
    }
  }, [voteWasStarted, voteType, setShowVotingModal]);

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
        <div className="h-[40px] w-[40px] md:h-[44px] md:w-[44px]">
          <SecondaryButton
            icon={<IoSettingsSharp size={"1.5rem"} />}
            extraPadding={false}
            disabled={!isSignedIn}
            hoverTooltipText={"Only available for logged in users"}
            hoverTooltipTextPosition={"left"}
            onClickFunction={() => {
              if (isSignedIn) {
                setShowSettingsModal(true);
              }
            }}
          />
        </div>
      )}

      <AudioLevelSlider />

      {asPath.includes("/game") && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="secondary"
                icon={<TbDoorExit size={"1.5rem"} />}
                className="h-11 w-11"
              />
            </AlertDialogTrigger>
            <AlertDialogContent className="baseVertFlex gap-8">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center">
                  Are you sure you want to leave the game?
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter className="baseFlex !justify-center gap-4">
                <AlertDialogCancel asChild>
                  <Button
                    variant={"secondary"}
                    innerText={"Cancel"}
                    className="w-24"
                  />
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant={"destructive"}
                    innerText={"Confirm"}
                    className="w-24"
                    onClick={() => {
                      leaveRoom();
                    }}
                  />
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="absolute right-0 top-[60px]">
            <SecondaryButton
              icon={<MdHowToVote size={"1.5rem"} />}
              extraPadding={false}
              style={{
                position: "absolute",
                right: "0px",
                top: "0px",
                width: "2.75rem",
                height: "2.75rem",
              }}
              onClickFunction={() => {
                setShowVotingModal(true);
              }}
            />

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
          <SecondaryButton
            icon={<FaUserFriends size={"1.5rem"} />}
            extraPadding={false}
            disabled={!isSignedIn}
            hoverTooltipText={"Only available for logged in users"}
            hoverTooltipTextPosition={"left"}
            onClickFunction={() => setShowFriendsList(!showFriendsList)}
          />

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
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
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
                    className={`h-4 w-full rounded-md ${
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
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                opacity: { duration: 0.15 }, // TODO: fix this so that it smoothly shrinks down dimensions without jank
                height: { duration: 0.15 }, // TODO: fix this so that it smoothly shrinks down dimensions without jank
              }}
              className="baseFlex w-full gap-4 p-4 tablet:!flex-col"
            >
              {voteType === null ? (
                <>
                  <div className="relative h-12 w-full">
                    <SecondaryButton
                      icon={<FaArrowsRotate size={"1rem"} />}
                      extraPadding={false}
                      innerText="Rotate decks"
                      width={"100%"}
                      height={"3rem"}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        fontSize: "0.85rem",
                      }}
                      onClickFunction={() => {
                        setShowVotingOptionButtons(false);
                        toast.dismiss();
                        setShowDrawer?.(false);

                        socket.emit("voteReceived", {
                          roomCode: roomConfig.code,
                          voteType: "rotateDecks",
                          voteDirection: "for",
                        });
                      }}
                    />

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
                    <SecondaryButton
                      icon={<MdSkipNext size={"1.25rem"} />}
                      extraPadding={false}
                      innerText="Finish the round"
                      width={"100%"}
                      height={"3rem"}
                      style={{
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                      onClickFunction={() => {
                        setShowVotingOptionButtons(false);
                        toast.dismiss();
                        setShowDrawer?.(false);

                        socket.emit("voteReceived", {
                          roomCode: roomConfig.code,
                          voteType: "finishRound",
                          voteDirection: "for",
                        });
                      }}
                    />

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
                </>
              ) : (
                <div className="baseFlex w-full gap-2">
                  <SecondaryButton
                    icon={<IoIosCheckmark size={"2rem"} />}
                    extraPadding={false}
                    innerText="Yes"
                    width={"50%"}
                    height={"2rem"}
                    style={{
                      gap: "0.25rem",
                    }}
                    onClickFunction={() => {
                      setShowVotingOptionButtons(false);
                      toast.dismiss();
                      setShowDrawer?.(false);

                      socket.emit("voteReceived", {
                        roomCode: roomConfig.code,
                        voteType,
                        voteDirection: "for",
                      });
                    }}
                  />

                  <SecondaryButton
                    icon={<IoClose size={"1.25rem"} />}
                    extraPadding={false}
                    innerText="No"
                    width={"50%"}
                    height={"2rem"}
                    onClickFunction={() => {
                      setShowVotingOptionButtons(false);
                      toast.dismiss();
                      setShowDrawer?.(false);

                      socket.emit("voteReceived", {
                        roomCode: roomConfig.code,
                        voteType,
                        voteDirection: "against",
                      });
                    }}
                  />
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
          transition={{ duration: 0.15 }}
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
        return "375px";
      case "Friends list":
        return "500px";
      case "Friend actions":
        return "280px";
      case "avatar":
        return "350px";
      case "front":
        return "225px";
      case "back":
        return "400px";
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
                isDisabled={status === "unauthenticated"}
                style={{
                  borderTopWidth: label === "Settings" ? "0px" : "1px",
                }}
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
                <SignOutButton>
                  <SecondaryButton
                    innerText="Log out"
                    extraPadding={false}
                    width={"8rem"}
                    height={"2.5rem"}
                  />
                </SignOutButton>
              </div>
            )}

            <div className="baseFlex gap-1.5 py-2 text-sm">
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
            <Button
              variant={"ghost"}
              onClick={() => setRenderedView("Settings")}
              className="baseFlex absolute left-2 top-0 gap-2 !p-0"
            >
              <IoIosArrowForward size={"1rem"} className="rotate-180" />
              Back
            </Button>

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
      utils.users.getUserByID.invalidate(userID);
    },
  });

  const [ableToSave, setAbleToSave] = useState<boolean>(false);
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
      prefersSimpleCardAssets: user.prefersSimpleCardAssets,
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
      localPlayerSettings.prefersSimpleCardAssets !==
        user.prefersSimpleCardAssets ||
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
      prefersSimpleCardAssets: localPlayerSettings.prefersSimpleCardAssets,
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
      <Button
        variant={"ghost"}
        onClick={() => setRenderedView(undefined)}
        className="baseFlex absolute left-2 top-0 gap-2 !p-0"
      >
        <IoIosArrowForward size={"1rem"} className="rotate-180" />
        Back
      </Button>

      <div className="absolute right-2 top-1">
        <Button
          innerText="Save"
          innerTextWhenLoading={"Saving"}
          icon={<IoSave size={"1.25rem"} />}
          disabled={!ableToSave || usernameIsProfane}
          isDisabled={!ableToSave || usernameIsProfane}
          onClick={() => updateUserHandler()}
          showLoadingSpinnerOnClick
          className="baseFlex h-[2.5rem] w-[7rem] gap-2 px-4 py-0.5"
        />
      </div>

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
                style={{
                  right: "-255px",
                  color: "hsl(120deg 100% 86%)",
                }}
                className="baseVertFlex absolute top-0 gap-2 rounded-md border-2 border-red-700 bg-green-700 pb-2 pl-1 pr-1 pt-2 shadow-md"
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
            className="baseFlex h-full w-full !justify-start border-t-[1px]"
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
      <Button
        variant={"ghost"}
        onClick={() => setRenderedView(undefined)}
        className="baseFlex absolute left-2 top-0 gap-2 !p-0"
      >
        <IoIosArrowForward size={"1rem"} className="rotate-180" />
        Back
      </Button>

      <div className="baseVertFlex color-darkGreen gap-6 rounded-md border-2 border-darkGreen p-4">
        {rowNames.map((rowName, index) => (
          <div key={index} className="baseFlex w-full !justify-between gap-8">
            <div className="text-lg font-semibold">{rowName}</div>
            {filteredStats ? (
              <div className="text-lg font-semibold">
                {Object.values(filteredStats)[index]}
              </div>
            ) : (
              <div
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderTop: `0.35rem solid hsla(120deg, 100%, 18%, 40%)`,
                  borderRight: `0.35rem solid hsla(120deg, 100%, 18%, 40%)`,
                  borderBottom: `0.35rem solid hsla(120deg, 100%, 18%, 40%)`,
                  borderLeft: `0.35rem solid hsl(120deg 100% 18%)`,
                }}
                className="loadingSpinner"
              ></div>
            )}
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

  const { data: friends } = api.users.getUsersFromIDList.useQuery(
    friendData?.friendIDs ?? [],
  );
  const { data: friendInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.friendInviteIDs ?? [],
  );
  const { data: roomInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.roomInviteIDs ?? [],
  );

  useEffect(() => {
    // clears red notification dot if it exists
    if (newInviteNotification) {
      setNewInviteNotification(false);
    }
  }, [newInviteNotification, setNewInviteNotification]);

  return (
    <>
      <Button
        variant={"ghost"}
        onClick={() => setRenderedView(undefined)}
        className="baseFlex absolute left-2 top-0 gap-2 !p-0"
      >
        <IoIosArrowForward size={"1rem"} className="rotate-180" />
        Back
      </Button>

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
                      icon={<AiOutlineCheck size={"1.25rem"} />}
                      onClickFunction={() =>
                        socket.emit("modifyFriendData", {
                          action: "acceptFriendInvite",
                          initiatorID: userID,
                          targetID: friend.id,
                        })
                      }
                      className="gap-2 !p-2"
                    />

                    <Button
                      variant={"destructive"}
                      icon={<AiOutlineClose size={"1.25rem"} />}
                      onClickFunction={() =>
                        socket.emit("modifyFriendData", {
                          action: "declineFriendInvite",
                          initiatorID: userID,
                          targetID: friend.id,
                        })
                      }
                      className="gap-2 !p-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="baseFlex w-full">
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderTop: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                  borderRight: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                  borderBottom: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                  borderLeft: `0.35rem solid hsl(120deg 100% 86%)`,
                }}
                className="loadingSpinner"
              ></div>
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
                    icon={<AiOutlineCheck size={"1.25rem"} />}
                    onClickFunction={() => {
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
                  />

                  <Button
                    variant={"destructive"}
                    icon={<AiOutlineClose size={"1.25rem"} />}
                    onClickFunction={() =>
                      socket.emit("modifyFriendData", {
                        action: "declineRoomInvite",
                        initiatorID: userID,
                        targetID: friend.id,
                      })
                    }
                    className="gap-2 !p-2"
                  />
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
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderTop: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                  borderRight: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                  borderBottom: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                  borderLeft: `0.35rem solid hsl(120deg 100% 86%)`,
                }}
                className="loadingSpinner"
              ></div>
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
      <Button
        variant={"ghost"}
        onClick={() => setRenderedView("Friends list")}
        className="baseFlex absolute left-2 top-0 gap-2 !p-0"
      >
        <IoIosArrowForward size={"1rem"} className="rotate-180" />
        Back
      </Button>

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
          isDisabled={
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
          isDisabled={
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
                <Button
                  variant={"secondary"}
                  innerText={"Cancel"}
                  className="w-24"
                />
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant={"destructive"}
                  innerText={"Confirm"}
                  className="w-24"
                  onClick={() => {
                    socket.emit("modifyFriendData", {
                      action: "removeFriend",
                      initiatorID: userID,
                      targetID: friend.id,
                    });
                    setRenderedView("Friends list");
                  }}
                />
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
            <Button
              variant="destructive"
              icon={<TbDoorExit size={"1.5rem"} />}
              innerText={"Leave game"}
              className="gap-2"
            />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader className="baseFlex w-full">
              <AlertDialogTitle className="w-48">
                Are you sure you want to leave the game?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter className="baseFlex mt-4 !flex-row gap-8">
              <AlertDialogCancel asChild>
                <Button
                  variant={"secondary"}
                  innerText={"Cancel"}
                  className="m-0 w-24"
                />
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant={"destructive"}
                  innerText={"Confirm"}
                  className="m-0 w-24"
                  onClick={() => {
                    setShowDrawer(false);
                    leaveRoom();
                  }}
                />
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
