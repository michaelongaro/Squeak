import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import cryptoRandomString from "crypto-random-string";
import { api } from "~/utils/api";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import {
  type IRoomPlayersMetadata,
  type IGameMetadata,
  type IRoomPlayer,
} from "../../pages/api/socket";
import { IoSettingsSharp } from "react-icons/io5";
import { FaRobot } from "react-icons/fa6";
import { FaUsers } from "react-icons/fa";
import PlayerIcon from "~/components/playerIcons/PlayerIcon";
import Radio from "~/components/ui/Radio";
import { MdCopyAll } from "react-icons/md";
import { IoHome } from "react-icons/io5";
import { BiArrowBack } from "react-icons/bi";
import AnimatedNumbers from "~/components/ui/AnimatedNumbers";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "~/components/ui/input";
import Filter from "bad-words";
import useLeaveRoom from "../../hooks/useLeaveRoom";
import PlayerCustomizationPopover from "~/components/popovers/PlayerCustomizationPopover";
import PlayerCustomizationPreview from "~/components/playerIcons/PlayerCustomizationPreview";
import PlayerCustomizationSheet from "~/components/sheets/PlayerCustomizationSheet";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/router";
import { avatarPaths } from "~/utils/avatarPaths";
import { oklchToDeckHueRotations } from "~/utils/oklchToDeckHueRotations";

const filter = new Filter();

const botNames = [
  "Bot Eric",
  "Bot John",
  "Bot Tyrus",
  "Bot Antonio",
  "Bot Galvin",
  "Bot Owen",
  "Bot Alex",
  "Bot Ritz",
  "Bot George",
  "Bot Michael",
  "Bot Andrew",
  "Bot Gilbert",
  "Bot Anthony",
  "Bot Amber",
];

export interface IRoomConfig {
  pointsToWin: number;
  maxPlayers: number;
  playersInRoom: number;
  playerIDsInRoom: string[];
  isPublic: boolean;
  code: string;
  hostUsername: string;
  hostUserID: string;
  gameStarted: boolean;
}

function CreateRoom() {
  const { isSignedIn } = useAuth();
  const { push } = useRouter();

  const userID = useUserIDContext();

  const {
    roomConfig,
    setRoomConfig,
    playerMetadata,
    setPlayerMetadata,
    connectedToRoom,
    setConnectedToRoom,
    friendData,
    setGameData,
    viewportLabel,
  } = useRoomContext();

  const leaveRoom = useLeaveRoom({
    routeToNavigateTo: connectedToRoom ? "/create" : "/",
  });

  const { data: authenticatedUsers } = api.users.getUsersFromIDList.useQuery(
    Object.keys(playerMetadata),
    {
      enabled: Object.keys(playerMetadata).length > 0,
    },
  );

  const [configAndMetadataInitialized, setConfigAndMetadataInitialized] =
    useState<boolean>(false);
  const [focusedInInput, setFocusedInInput] = useState<boolean>(false);
  const [usernameIsProfane, setUsernameIsProfane] = useState<boolean>(false);

  const [createButtonText, setCreateButtonText] = useState<string>("Create");
  const [startGameButtonText, setStartGameButtonText] =
    useState<string>("Start game");
  const [copyRoomCodeButtonText, setCopyRoomCodeButtonText] =
    useState<string>("Copy");

  const [startRoundCountdownValue, setStartRoundCountdownValue] =
    useState<number>(3);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);

  // needs !connectedToRoom for when player inherits ownership of room after prev
  // host leaves, otherwise this effect would be overwriting the current room config
  useEffect(() => {
    if (!configAndMetadataInitialized && userID && !connectedToRoom) {
      setRoomConfig({
        ...roomConfig,
        code: cryptoRandomString({ length: 6, type: "numeric" }),
        playerIDsInRoom: [userID],
        hostUsername: playerMetadata[userID]?.username || "",
        hostUserID: userID,
      });

      setConfigAndMetadataInitialized(true);
    }
  }, [
    configAndMetadataInitialized,
    userID,
    connectedToRoom,
    playerMetadata,
    roomConfig,
    setRoomConfig,
  ]);

  useEffect(() => {
    function handleRoomWasCreated({
      roomConfig,
      playerMetadata,
    }: {
      roomConfig: IRoomConfig;
      playerMetadata: IRoomPlayersMetadata;
    }) {
      setConnectedToRoom(true);
      setRoomConfig(roomConfig);
      setPlayerMetadata(playerMetadata);

      if (isSignedIn) {
        socket.volatile.emit("modifyFriendData", {
          action: "createRoom",
          initiatorID: userID,
          roomCode: roomConfig.code,
          currentRoomIsPublic: roomConfig.isPublic,
        });
      }
    }

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

            setTimeout(() => {
              socket.volatile.emit("startGame", {
                roomCode: roomConfig.code,
                firstRound: true,
              });
            }, 500);
          }, 1000);
        }, 1000);
      }, 500);
    }

    socket.on("roomWasCreated", handleRoomWasCreated);
    socket.on("playerMetadataUpdated", handlePlayerMetadataUpdated);
    socket.on("roomConfigUpdated", handleRoomConfigUpdated);
    socket.on("navigateToPlayScreen", handleNavigateToPlayScreen);
    socket.on("startRoundCountdown", handleStartRoundCountdown);

    return () => {
      socket.off("roomWasCreated", handleRoomWasCreated);
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
    isSignedIn,
    userID,
  ]);

  function createRoom() {
    if (roomConfig && userID) {
      setTimeout(() => {
        socket.volatile.emit("createRoom", roomConfig, playerMetadata[userID]);
      }, 1000);
    }
  }

  function updateRoomConfig(key: string, value: any) {
    setRoomConfig({ ...roomConfig, [key]: value });
    if (connectedToRoom) {
      socket.volatile.emit("updateRoomConfig", {
        ...roomConfig,
        [key]: value,
      });
    }
  }

  function getNewBotMetadata() {
    let randomBotName = "";
    do {
      randomBotName = botNames[
        Math.floor(Math.random() * botNames.length)
      ] as string;
    } while (
      Object.values(playerMetadata).findIndex(
        (player) => player?.username === randomBotName,
      ) !== -1
    );

    const randomAvatarPath =
      avatarPaths[Math.floor(Math.random() * avatarPaths.length)];

    const oklchToDeckArray = Object.entries(oklchToDeckHueRotations);
    const [randomColor, randomDeckHueRotation] = oklchToDeckArray[
      Math.floor(Math.random() * oklchToDeckArray.length)
    ] as [string, number];

    return {
      username: randomBotName,
      avatarPath: randomAvatarPath,
      color: randomColor,
      deckHueRotation: randomDeckHueRotation,
      botDifficulty: "Medium",
    } as IRoomPlayer;
  }

  return (
    <motion.div
      key={"createRoom"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="baseVertFlex relative min-h-[100dvh] pb-16 tablet:pt-16"
    >
      <div className="baseVertFlex relative gap-4">
        <div className="baseFlex sticky left-0 top-0 z-[105] w-screen !justify-start gap-4 border-b-2 border-white bg-gradient-to-br from-green-800 to-green-850 p-2 shadow-lg tablet:relative tablet:w-full tablet:bg-none tablet:shadow-none">
          <Button
            variant={"secondary"}
            className="size-10"
            onClick={() => {
              leaveRoom();

              // don't bother resetting these states if returning to
              // the homepage
              if (connectedToRoom) {
                setConfigAndMetadataInitialized(false);
                setShowCountdown(false);
                setCreateButtonText("Create");
                setStartGameButtonText("Start game");
                setStartRoundCountdownValue(3);
              }
            }}
          >
            {connectedToRoom ? (
              <BiArrowBack size={"1.25rem"} />
            ) : (
              <IoHome size={"1.25rem"} />
            )}
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
                : "Create room"
            }`}
          </div>
        </div>

        {!connectedToRoom && (
          <div className="baseVertFlex mt-4 gap-4 rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 p-4">
            <div className="baseFlex gap-2">
              <Label className="text-lightGreen">Username</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="username"
                  maxLength={16}
                  onFocus={() => setFocusedInInput(true)}
                  onBlur={() => setFocusedInInput(false)}
                  onChange={(e) => {
                    setUsernameIsProfane(filter.isProfane(e.target.value));

                    if (!isSignedIn) {
                      localStorage.setItem("squeak-username", e.target.value);
                    }

                    setPlayerMetadata({
                      ...playerMetadata,
                      [userID]: {
                        ...playerMetadata[userID],
                        username: e.target.value,
                      } as IRoomPlayer,
                    });
                    updateRoomConfig("hostUsername", e.target.value);
                  }}
                  value={playerMetadata[userID]?.username || ""}
                />
                <div
                  style={{
                    opacity:
                      focusedInInput ||
                      playerMetadata[userID]?.username?.length === 0
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
                      key={"createRoomProfanityWarning"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="baseVertFlex absolute -right-2 top-11 z-[200] whitespace-nowrap rounded-md border-2 border-red-700 bg-green-700 px-4 py-2 text-sm text-lightGreen shadow-md tablet:right-[-255px] tablet:top-0"
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

            {viewportLabel === "tablet" || viewportLabel === "desktop" ? (
              <div className="baseFlex gap-12 text-lightGreen">
                <div className="baseVertFlex gap-2">
                  <PlayerCustomizationPopover type={"avatar"} />
                  <p className="mt-[0.25rem]">Avatar</p>
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
                  <div className="baseVertFlex">
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
        )}

        <fieldset className="mt-4 w-[350px] rounded-md border-2 border-white p-2 sm:min-w-[450px] sm:p-4">
          <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg text-lightGreen">
            <IoSettingsSharp size={"1.25rem"} />
            Room settings
          </legend>

          <div className="grid grid-cols-2 grid-rows-4 items-center gap-y-4 p-1 text-lightGreen sm:p-2">
            <Label>Points to win:</Label>
            <div className="baseFlex !justify-between gap-2 sm:px-4">
              <Button
                variant={"secondary"}
                disabled={roomConfig.pointsToWin <= 25}
                onClick={() =>
                  updateRoomConfig("pointsToWin", roomConfig.pointsToWin - 25)
                }
                className="size-12"
              >
                -25
              </Button>

              <div className="w-7 text-center text-lightGreen">
                {roomConfig.pointsToWin}
              </div>

              <Button
                variant={"secondary"}
                disabled={roomConfig.pointsToWin >= 300}
                onClick={() =>
                  updateRoomConfig("pointsToWin", roomConfig.pointsToWin + 25)
                }
                className="size-12"
              >
                +25
              </Button>
            </div>

            <Label>Players:</Label>
            <Radio
              values={[2, 3, 4, 5]}
              disabledIndicies={[0, 1, 2, 3].slice(
                0,
                Math.max(0, Object.keys(playerMetadata).length - 2),
              )}
              currentValueIndex={[2, 3, 4, 5, 6].indexOf(roomConfig.maxPlayers)}
              onClickFunctions={[
                () => updateRoomConfig("maxPlayers", 2),
                () => updateRoomConfig("maxPlayers", 3),
                () => updateRoomConfig("maxPlayers", 4),
                () => updateRoomConfig("maxPlayers", 5),
              ]}
            />

            <Label>Room visibility:</Label>
            <Radio
              values={["Public", "Private"]}
              currentValueIndex={["Public", "Private"].indexOf(
                roomConfig.isPublic ? "Public" : "Private",
              )}
              onClickFunctions={[
                () => updateRoomConfig("isPublic", true),
                () => updateRoomConfig("isPublic", false),
              ]}
            />

            <Label>Room code:</Label>
            <div className="baseFlex gap-2 sm:gap-4">
              <div className="text-lightGreen">{roomConfig.code}</div>

              <Button
                variant={"secondary"}
                disabled={copyRoomCodeButtonText !== "Copy"}
                onClick={() => {
                  setCopyRoomCodeButtonText("Copied");
                  navigator.clipboard.writeText(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/join/${roomConfig.code}`,
                  );
                  setTimeout(() => setCopyRoomCodeButtonText("Copy"), 1750);
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
                    className="baseFlex h-12 w-[7rem] gap-2 text-sm"
                  >
                    {copyRoomCodeButtonText}
                    {copyRoomCodeButtonText === "Copy" && (
                      <MdCopyAll size={"1.25rem"} />
                    )}
                    {copyRoomCodeButtonText === "Copied" && (
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
        </fieldset>

        {connectedToRoom ? (
          <div className="baseVertFlex gap-4 pt-4 text-lightGreen">
            <fieldset className="w-[350px] rounded-md border-2 border-white p-4 sm:min-w-max">
              <legend className="baseFlex h-7 gap-4 px-2 sm:px-4">
                <div className="baseFlex gap-2 text-lg">
                  <FaUsers size={"1.25rem"} className="ml-1" />
                  Players
                  <div className="tracking-tighter">{`( ${roomConfig.playersInRoom} / ${roomConfig.maxPlayers} )`}</div>
                </div>

                <Button
                  variant={"secondary"}
                  disabled={
                    Object.keys(playerMetadata).length === roomConfig.maxPlayers
                  }
                  onClick={() => {
                    const botID = cryptoRandomString({ length: 16 });

                    socket.volatile.emit("joinRoom", {
                      code: roomConfig.code,
                      userID: botID,
                      playerMetadata: getNewBotMetadata(),
                    });
                  }}
                  className="baseFlex gap-2 whitespace-nowrap !px-4 text-xs"
                >
                  <FaRobot size={"1.5rem"} />
                  Add bot
                </Button>
              </legend>
              <div className="baseVertFlex gap-6 p-2">
                <div
                  className={`grid grid-cols-2 ${
                    roomConfig.playersInRoom > 2 ? "grid-rows-2" : "grid-rows-1"
                  } !items-start !justify-start overflow-hidden p-4 pb-0 sm:flex sm:!flex-row`}
                >
                  <AnimatePresence mode="popLayout">
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
                        username={playerMetadata[playerID]?.username}
                        playerID={playerID}
                        size={"3rem"}
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
                        showRemovePlayerFromRoomButton={userID !== playerID}
                        playerMetadata={playerMetadata[playerID]}
                        roomHostIsRendering={true}
                        animatePresence={true}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                <div className="h-[2px] w-full rounded-md bg-white"></div>

                {viewportLabel === "tablet" || viewportLabel === "desktop" ? (
                  <div className="baseFlex gap-12 text-lightGreen">
                    <div className="baseVertFlex gap-2">
                      <PlayerCustomizationPopover type={"avatar"} />
                      <p className="mt-[0.25rem]">Avatar</p>
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
                      <div className="baseVertFlex">
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
                  className="baseFlex"
                >
                  <Button
                    disabled={roomConfig.playersInRoom < 2}
                    onClick={() => {
                      setStartGameButtonText("Loading");
                      socket.volatile.emit("broadcastRoomActionCountdown", {
                        code: roomConfig.code,
                        hostUserID: userID,
                        type: "startRound",
                      });
                    }}
                    className="h-11 w-[14rem] font-medium"
                  >
                    <AnimatePresence mode={"popLayout"} initial={false}>
                      <motion.div
                        key={startGameButtonText}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{
                          duration: 0.25,
                        }}
                        className="baseFlex h-11 w-[14rem] gap-2"
                      >
                        {startGameButtonText}
                        {startGameButtonText === "Start game" && (
                          <BiArrowBack className="scale-x-flip size-4" />
                        )}
                        {startGameButtonText === "Loading" && (
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
              ) : (
                <motion.div
                  key={"startRoundCountdown"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="baseFlex h-11 gap-2"
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
        ) : (
          <Button
            disabled={
              createButtonText !== "Create" ||
              playerMetadata[userID]?.username.length === 0 ||
              usernameIsProfane
            }
            onClick={() => {
              setCreateButtonText("Creating");
              createRoom();
            }}
            className="h-12 w-[12rem]"
          >
            <AnimatePresence mode={"popLayout"} initial={false}>
              <motion.div
                key={createButtonText}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                  duration: 0.25,
                }}
                className="baseFlex h-12 w-[12rem] gap-4 text-[1.05rem] font-medium"
              >
                {createButtonText}
                {createButtonText === "Creating" && (
                  <div
                    className="inline-block size-4 animate-spin rounded-full border-[2px] border-darkGreen border-t-transparent text-darkGreen"
                    role="status"
                    aria-label="loading"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default CreateRoom;
