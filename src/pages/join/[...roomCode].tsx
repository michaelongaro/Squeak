import { useAuth } from "@clerk/nextjs";
import { type Room } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { BiArrowBack } from "react-icons/bi";
import { FaUsers } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { MdCopyAll } from "react-icons/md";
import PlayerCustomizationSheet from "~/components/sheets/PlayerCustomizationSheet";
import PlayerCustomizationPreview from "~/components/playerIcons/PlayerCustomizationPreview";
import PlayerIcon from "~/components/playerIcons/PlayerIcon";
import PlayerCustomizationPopover from "~/components/popovers/PlayerCustomizationPopover";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import { MdQuestionMark } from "react-icons/md";
import TutorialDialog from "~/components/dialogs/TutorialDialog";
import { IoHome } from "react-icons/io5";
import { Button } from "~/components/ui/button";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import { useRoomContext } from "../../context/RoomContext";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { useUserIDContext } from "../../context/UserIDContext";
import useLeaveRoom from "../../hooks/useLeaveRoom";
import {
  type IGameMetadata,
  type IRoomPlayersMetadata,
} from "../../pages/api/socket";
import { type IRoomConfig } from "../create";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import UnableToJoinRoom from "~/components/Play/UnableToJoinRoom";
import AnimatedNumbers from "~/components/ui/AnimatedNumbers";

const obscenityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

function JoinRoom() {
  const { isLoaded, isSignedIn } = useAuth();
  const userID = useUserIDContext();
  const { push, query } = useRouter();

  const roomCode = query?.roomCode?.[0];

  const {
    playerMetadata,
    setPlayerMetadata,
    roomConfig,
    setRoomConfig,
    setGameData,
    connectedToRoom,
    setConnectedToRoom,
    friendData,
    viewportLabel,
  } = useRoomContext();

  const leaveRoom = useLeaveRoom({
    routeToNavigateTo: "/join",
  });

  const [showExitRoomSpinner, setShowExitRoomSpinner] = useState(false);

  // for username prompt
  const [username, setUsername] = useState("");
  const [focusedInInput, setFocusedInInput] = useState(false);
  const [usernameIsProfane, setUsernameIsProfane] = useState(false);
  const [joinRoomText, setJoinRoomText] = useState<string>("Join room");
  const [hoveringOnStartGameButton, setHoveringOnStartGameButton] =
    useState<boolean>(false);

  // dynamic initialization flow state
  const [
    dynamicInitializationFlowStarted,
    setDynamicInitializationFlowStarted,
  ] = useState(false);
  const [showRoomNotFoundDialog, setShowRoomNotFoundDialog] = useState(false);
  const [showUsernamePromptDialog, setShowUsernamePromptDialog] =
    useState(false);
  const [showRoomIsFullDialog, setShowRoomIsFullDialog] = useState(false);
  const [showGameAlreadyStartedDialog, setShowGameAlreadyStartedDialog] =
    useState(false);

  const [copyRoomCodeButtonText, setCopyRoomCodeButtonText] =
    useState<string>("Copy invite link");

  const [startRoundCountdownValue, setStartRoundCountdownValue] =
    useState<number>(3);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [showTutorialDialog, setShowTutorialDialog] = useState(false);

  const { data: roomResult } = api.rooms.findRoomByCode.useQuery(
    {
      roomCode: roomCode ?? "",
      playerID: userID,
    },
    {
      enabled: Boolean(roomCode && typeof roomCode === "string"),
    },
  );

  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (roomResult && typeof roomResult === "object") {
      setRoom(roomResult);
    } else {
      if (roomResult === "Room not found.") {
        setShowRoomNotFoundDialog(true);
      } else if (roomResult === "Room is full.") {
        setShowRoomIsFullDialog(true);
      } else if (roomResult === "Game has already started.") {
        setShowGameAlreadyStartedDialog(true);
      }
    }
  }, [roomResult]);

  const { data: authenticatedUsers } = api.users.getUsersFromIDList.useQuery(
    Object.keys(playerMetadata),
    {
      enabled: Object.keys(playerMetadata).length > 0,
    },
  );

  useEffect(() => {
    function handlePlayerMetadataUpdated(newUsers: IRoomPlayersMetadata) {
      setPlayerMetadata(newUsers);
    }

    function handleRoomConfigUpdated(roomConfig: IRoomConfig) {
      setRoomConfig(roomConfig);
    }

    function handleNavigateToPlayScreen({
      gameData,
      roomConfig,
    }: {
      gameData: IGameMetadata;
      roomConfig: IRoomConfig;
    }) {
      push(`/game/${roomConfig.code}`);
      setGameData(gameData);
      setRoomConfig(roomConfig);
    }

    function handleStartRoundCountdown() {
      setShowCountdown(true);

      setTimeout(() => {
        setStartRoundCountdownValue(3);

        setTimeout(() => {
          setStartRoundCountdownValue(2);

          setTimeout(() => {
            setStartRoundCountdownValue(1);
          }, 1000);
        }, 1000);
      }, 500);
    }

    socket.on("playerMetadataUpdated", handlePlayerMetadataUpdated);
    socket.on("roomConfigUpdated", handleRoomConfigUpdated);
    socket.on("navigateToPlayScreen", handleNavigateToPlayScreen);
    socket.on("startRoundCountdown", handleStartRoundCountdown);

    return () => {
      socket.off("playerMetadataUpdated", handlePlayerMetadataUpdated);
      socket.off("roomConfigUpdated", handleRoomConfigUpdated);
      socket.off("navigateToPlayScreen", handleNavigateToPlayScreen);
      socket.off("startRoundCountdown", handleStartRoundCountdown);
    };
  }, [
    setConnectedToRoom,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
    push,
    roomConfig.code,
  ]);

  const dynamicallyHandleInitializationFlow = useCallback(() => {
    // player was a part of the room already, rejoining.
    if (room && room.playerIDsInRoom.includes(userID) && !connectedToRoom) {
      socket.emit(
        "rejoinRoom",
        {
          userID,
          code: room.code,
        },
        (response?: "gameStarted") => {
          if (response === "gameStarted") {
            push(`/game/${room.code}`);
          }
        },
      );

      setShowUsernamePromptDialog(false);
    }

    // player was not a part of the room, joining since game hasn't started
    // and room isn't full.
    else if (
      room &&
      !room.playerIDsInRoom.includes(userID) &&
      !connectedToRoom &&
      !room.gameStarted &&
      room.playerIDsInRoom.length < room.maxPlayers
    ) {
      if (isSignedIn && playerMetadata[userID]) {
        socket.emit("joinRoom", {
          userID,
          code: room.code,
          playerMetadata: playerMetadata[userID],
        });

        setConnectedToRoom(true);
      } else {
        setShowUsernamePromptDialog(true);
      }
    }
  }, [
    connectedToRoom,
    isSignedIn,
    playerMetadata,
    room,
    setConnectedToRoom,
    userID,
    push,
  ]);

  useEffect(() => {
    if (
      dynamicInitializationFlowStarted ||
      !isLoaded ||
      !userID ||
      !playerMetadata[userID] ||
      !room ||
      connectedToRoom
    )
      return;

    setDynamicInitializationFlowStarted(true);

    dynamicallyHandleInitializationFlow();
  }, [
    dynamicInitializationFlowStarted,
    dynamicallyHandleInitializationFlow,
    room,
    userID,
    isLoaded,
    playerMetadata,
    connectedToRoom,
  ]);

  if (
    showRoomNotFoundDialog ||
    showRoomIsFullDialog ||
    showGameAlreadyStartedDialog
  ) {
    const headerText = showRoomNotFoundDialog
      ? "Room not found"
      : showRoomIsFullDialog
        ? "Room is full"
        : "Game in progress";

    const bodyText = showRoomNotFoundDialog
      ? "The room you are looking for does not exist."
      : showRoomIsFullDialog
        ? "The room you are trying to join is full."
        : "The room you are trying to join is has already started its game.";

    return <UnableToJoinRoom header={headerText} body={bodyText} />;
  }

  return (
    <motion.div
      key={"joinedRoom"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`baseVertFlex relative min-h-[100dvh] !justify-start pb-16 tablet:!justify-center tablet:pt-16 ${showUsernamePromptDialog ? "pt-16" : ""}`}
    >
      <AnimatePresence mode={"wait"}>
        {showUsernamePromptDialog && room && (
          <motion.div
            key={"usernamePromptDialog"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="baseVertFlex my-auto gap-4 rounded-md border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 px-6 py-4 text-lightGreen sm:px-12 sm:py-8"
          >
            <div className="baseVertFlex gap-4">
              <p className="text-nowrap font-semibold">
                Enter a username to join the room
              </p>

              <div className="baseFlex gap-2">
                <Label className="text-lightGreen">Username</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="username"
                    maxLength={16}
                    onFocus={() => setFocusedInInput(true)}
                    onBlur={() => setFocusedInInput(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setJoinRoomText("Loading");

                        setTimeout(() => {
                          socket.emit(
                            "joinRoom",
                            {
                              userID,
                              code: room.code,
                              playerMetadata: {
                                ...playerMetadata[userID],
                                username,
                              },
                            },
                            (response?: "roomIsFull") => {
                              if (response === "roomIsFull") {
                                setShowRoomIsFullDialog(true);
                              } else {
                                setShowUsernamePromptDialog(false);
                                setConnectedToRoom(true);
                              }
                            },
                          );
                        }, 1500);
                      }
                    }}
                    onChange={(e) => {
                      setUsernameIsProfane(
                        obscenityMatcher.hasMatch(e.target.value),
                      );

                      setUsername(e.target.value);
                    }}
                    value={username}
                    className="w-48"
                  />
                  <div
                    style={{
                      opacity: focusedInInput || username.length === 0 ? 1 : 0,
                    }}
                    className="absolute right-1 top-0 text-xl text-red-600 transition-opacity"
                  >
                    *
                  </div>

                  <AnimatePresence>
                    {usernameIsProfane && (
                      <motion.div
                        key={"joinRoomProfanityWarning"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="baseVertFlex absolute right-[-33px] top-11 z-[200] whitespace-nowrap rounded-md border-2 border-[hsl(0,84%,60%)] bg-gradient-to-br from-red-50 to-red-100 px-4 py-2 text-sm text-[hsl(0,84%,40%)] shadow-md tablet:right-[-235px] tablet:top-0"
                      >
                        <div>Username not allowed,</div>
                        <div className="text-center">
                          please choose another one
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <motion.div
              key={"waitingForHostToStart"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onPointerEnter={() => {
                if (usernameIsProfane || username.length === 0) return;
                setHoveringOnStartGameButton(true);
              }}
              onPointerLeave={() => {
                setHoveringOnStartGameButton(false);
              }}
              onPointerCancel={() => {
                setHoveringOnStartGameButton(false);
              }}
              className="baseFlex w-full !justify-between px-1.5"
            >
              <Button
                variant={"secondary"}
                className="size-10"
                onClick={() => {
                  push("/");
                }}
              >
                <IoHome size={"1.25rem"} />
              </Button>

              <Button
                disabled={
                  usernameIsProfane ||
                  username.length === 0 ||
                  joinRoomText !== "Join room"
                }
                className="my-2 gap-4 px-6 font-medium"
                onClick={() => {
                  setJoinRoomText("Loading");

                  setTimeout(() => {
                    socket.emit(
                      "joinRoom",
                      {
                        userID,
                        code: room.code,
                        playerMetadata: {
                          ...playerMetadata[userID],
                          username,
                        },
                      },
                      (response?: "roomIsFull") => {
                        if (response === "roomIsFull") {
                          setJoinRoomText("Room is full.");
                        } else {
                          setShowUsernamePromptDialog(false);
                          setConnectedToRoom(true);
                        }
                      },
                    );
                  }, 1500);
                }}
              >
                <AnimatePresence mode={"popLayout"} initial={false}>
                  <motion.div
                    key={joinRoomText}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="baseFlex h-11 w-[10rem] gap-2"
                  >
                    {joinRoomText}
                    {joinRoomText === "Join room" && (
                      <BiArrowBack
                        className={`relative size-4 scale-x-flip transition-all ${hoveringOnStartGameButton ? "translate-x-1" : ""}`}
                      />
                    )}
                    {joinRoomText === "Loading" && (
                      <div
                        className="ml-1 inline-block size-4 animate-spin rounded-full border-[2px] border-darkGreen border-t-transparent text-darkGreen"
                        role="status"
                        aria-label="loading"
                      >
                        <span className="sr-only">Loading...</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.div>
        )}

        {connectedToRoom &&
          !showUsernamePromptDialog &&
          Object.keys(playerMetadata).length > 1 && (
            <motion.div
              key={"mainJoinRoomContent"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="baseVertFlex relative gap-4"
            >
              <div className="baseFlex sticky left-0 top-0 z-[105] w-screen !justify-start gap-4 border-b-2 border-white bg-gradient-to-br from-green-800 to-green-850 p-2 shadow-lg tablet:relative tablet:w-full tablet:bg-none tablet:shadow-none">
                <Button
                  variant={"secondary"}
                  disabled={showExitRoomSpinner}
                  className="size-10"
                  onClick={() => {
                    setShowExitRoomSpinner(true);

                    setTimeout(() => {
                      leaveRoom();
                      setShowCountdown(false);
                      setStartRoundCountdownValue(3);
                    }, 500);
                  }}
                >
                  <AnimatePresence mode={"popLayout"} initial={false}>
                    {showExitRoomSpinner ? (
                      <motion.div
                        key={"exitRoomSpinner"}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.25 }}
                        className="baseFlex"
                      >
                        <div
                          className="inline-block size-4 animate-spin rounded-full border-[2px] border-lightGreen/25 border-t-transparent text-lightGreen"
                          role="status"
                          aria-label="loading"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={"exitRoomButton"}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.25 }}
                        className="baseFlex"
                      >
                        <BiArrowBack size={"1.25rem"} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>

                <div
                  style={{
                    filter: "drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.2))",
                  }}
                  className="text-xl font-medium text-lightGreen"
                >
                  {`${
                    connectedToRoom
                      ? `${Object.values(playerMetadata)[0]?.username}'s room`
                      : "Join room"
                  }`}
                </div>

                <Dialog
                  open={showTutorialDialog}
                  onOpenChange={(isOpen) => setShowTutorialDialog(isOpen)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant={"text"}
                      includeMouseEvents
                      onClick={() => setShowTutorialDialog(true)}
                      className="baseFlex z-[500] ml-auto mr-11 !p-0 tablet:hidden"
                    >
                      <MdQuestionMark size={"1.35rem"} />
                    </Button>
                  </DialogTrigger>

                  <TutorialDialog setShowDialog={setShowTutorialDialog} />
                </Dialog>
              </div>

              <div className="baseVertFlex gap-4 text-lightGreen">
                <fieldset className="baseVertFlex mt-4 gap-4 rounded-md border-2 border-white p-4">
                  <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg">
                    <IoSettingsSharp size={"1.25rem"} />
                    Room settings
                  </legend>
                  <div className="grid grid-cols-2 grid-rows-4 items-center gap-x-12 gap-y-2 text-nowrap p-2 xs:gap-x-24">
                    <div>Points to win:</div>
                    {roomConfig?.pointsToWin}

                    <div>Players:</div>
                    {roomConfig?.maxPlayers}

                    <div>Room visibility:</div>
                    {roomConfig?.isPublic ? "Public" : "Private"}

                    <div>Room code:</div>
                    <div className="baseFlex !justify-start gap-4">
                      {roomConfig?.code}
                    </div>
                  </div>

                  <Button
                    variant={"secondary"}
                    disabled={copyRoomCodeButtonText !== "Copy invite link"}
                    onClick={() => {
                      setCopyRoomCodeButtonText("Invite link copied");
                      navigator.clipboard.writeText(
                        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/join/${roomConfig.code}`,
                      );
                      setTimeout(
                        () => setCopyRoomCodeButtonText("Copy invite link"),
                        1750,
                      );
                    }}
                  >
                    <AnimatePresence mode={"popLayout"} initial={false}>
                      <motion.div
                        key={copyRoomCodeButtonText}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{
                          duration: 0.25,
                        }}
                        className="baseFlex h-12 w-[14rem] gap-2 text-sm"
                      >
                        {copyRoomCodeButtonText}
                        {copyRoomCodeButtonText === "Copy invite link" && (
                          <MdCopyAll size={"1.25rem"} />
                        )}
                        {copyRoomCodeButtonText === "Invite link copied" && (
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
                </fieldset>
                <fieldset className="rounded-md border-2 border-white p-4">
                  <legend className="baseFlex gap-2 px-4 text-left text-lg">
                    <FaUsers size={"1.25rem"} className="ml-1" />
                    Players
                    <div className="tracking-tighter">{`( ${roomConfig.playersInRoom} / ${roomConfig.maxPlayers} )`}</div>
                  </legend>
                  <div className="baseVertFlex gap-6 p-2">
                    <div
                      style={{
                        gridTemplateRows: "auto",
                      }}
                      className={`grid grid-cols-2 !items-start !justify-start sm:flex sm:!flex-row`}
                    >
                      <AnimatePresence mode={"popLayout"}>
                        {Object.keys(playerMetadata)?.map((playerID) => (
                          <PlayerIcon
                            key={playerID}
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
                            showAddFriendButton={
                              isSignedIn &&
                              userID !== playerID &&
                              friendData !== undefined &&
                              friendData.friendIDs.indexOf(playerID) === -1 &&
                              authenticatedUsers
                                ? authenticatedUsers.findIndex(
                                    (player) => player.userId === playerID,
                                  ) !== -1
                                : false
                            }
                            username={playerMetadata[playerID]?.username}
                            size={"3rem"}
                            playerMetadata={playerMetadata[playerID]}
                            animatePresence={true}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    <div className="h-[2px] w-full rounded-md bg-white"></div>

                    {viewportLabel === "tablet" ||
                    viewportLabel === "desktop" ? (
                      <div className="baseFlex gap-12 text-lightGreen">
                        <div className="baseVertFlex gap-2">
                          <PlayerCustomizationPopover type={"avatar"} />
                          <p className="mt-[0.3rem]">Avatar</p>
                        </div>
                        <div className="baseVertFlex gap-2">
                          <PlayerCustomizationPopover type={"front"} />
                          <p>Front</p>
                        </div>
                        <div className="baseVertFlex gap-2">
                          <PlayerCustomizationPopover type={"back"} />
                          <p>Back</p>
                        </div>
                      </div>
                    ) : (
                      <div className="baseVertFlex gap-4">
                        <div className="baseFlex gap-12">
                          <div className="baseVertFlex gap-[15px]">
                            <PlayerCustomizationPreview
                              renderedView={"avatar"}
                              forCreateAndJoin
                            />
                          </div>
                          <div className="baseVertFlex gap-2">
                            <PlayerCustomizationPreview
                              renderedView={"front"}
                              forCreateAndJoin
                            />
                          </div>
                          <div className="baseVertFlex gap-2">
                            <PlayerCustomizationPreview
                              renderedView={"back"}
                              forCreateAndJoin
                            />
                          </div>
                        </div>
                        <PlayerCustomizationSheet />
                      </div>
                    )}
                  </div>
                </fieldset>

                <AnimatePresence mode="wait">
                  {!showCountdown ? (
                    <motion.div
                      key={"waitingForHostToStart"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="!inline-block max-w-[300px] !items-baseline gap-1 xs:max-w-none"
                    >
                      <p className="inline-block items-baseline text-center">
                        <span>
                          waiting for{" "}
                          <span className="font-semibold">
                            {roomConfig.hostUsername}
                          </span>{" "}
                          to start the game
                        </span>
                        <div className="loadingDots ml-1.5">
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={"startRoundCountdown"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="baseFlex gap-2"
                    >
                      Game starting in{" "}
                      <AnimatedNumbers
                        value={startRoundCountdownValue}
                        fontSize={16}
                        padding={2}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
}

export default JoinRoom;
