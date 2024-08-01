import { useAuth } from "@clerk/nextjs";
import { type Room } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { BiArrowBack } from "react-icons/bi";
import { FaUsers } from "react-icons/fa";
import { TbDoorEnter } from "react-icons/tb";
import { FiCheck } from "react-icons/fi";
import { IoSettingsSharp } from "react-icons/io5";
import { MdCopyAll } from "react-icons/md";
import SecondaryButton from "~/components/Buttons/SecondaryButton";
import PlayerCustomizationDrawer from "~/components/drawers/PlayerCustomizationDrawer";
import PlayerCustomizationPreview from "~/components/playerIcons/PlayerCustomizationPreview";
import PlayerIcon from "~/components/playerIcons/PlayerIcon";
import PlayerCustomizationPopover from "~/components/popovers/PlayerCustomizationPopover";
import { Button } from "~/components/ui/button";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import { useRoomContext } from "../../context/RoomContext";
import Filter from "bad-words";
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

const filter = new Filter();

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

  const [showCheckmark, setShowCheckmark] = useState<boolean>(false);

  // for username prompt
  const [username, setUsername] = useState("");
  const [focusedInInput, setFocusedInInput] = useState(false);
  const [usernameIsProfane, setUsernameIsProfane] = useState(false);

  // dynamic initialization flow state
  const [
    dynamicInitializationFlowStarted,
    setDynamicInitializationFlowStarted,
  ] = useState(false);
  const [showRoomNotFoundModal, setShowRoomNotFoundModal] = useState(false);
  const [showUsernamePromptModal, setShowUsernamePromptModal] = useState(false);
  const [showRoomIsFullModal, setShowRoomIsFullModal] = useState(false);
  const [showGameAlreadyStartedModal, setShowGameAlreadyStartedModal] =
    useState(false);

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
        setShowRoomNotFoundModal(true);
      } else if (roomResult === "Room is full.") {
        setShowRoomIsFullModal(true);
      } else if (roomResult === "Game has already started.") {
        setShowGameAlreadyStartedModal(true);
      }
    }
  }, [roomResult]);

  const { data: authenticatedUsers } = api.users.getUsersFromIDList.useQuery(
    Object.keys(playerMetadata),
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

    socket.on("playerMetadataUpdated", handlePlayerMetadataUpdated);
    socket.on("roomConfigUpdated", handleRoomConfigUpdated);
    socket.on("navigateToPlayScreen", handleNavigateToPlayScreen);

    return () => {
      socket.off("playerMetadataUpdated", handlePlayerMetadataUpdated);
      socket.off("roomConfigUpdated", handleRoomConfigUpdated);
      socket.off("navigateToPlayScreen", handleNavigateToPlayScreen);
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

      setShowUsernamePromptModal(false);
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
        setShowUsernamePromptModal(true);
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
    showRoomNotFoundModal ||
    showRoomIsFullModal ||
    showGameAlreadyStartedModal
  ) {
    const headerText = showRoomNotFoundModal
      ? "Room not found"
      : showRoomIsFullModal
        ? "Room is full"
        : "Game in progress";

    const bodyText = showRoomNotFoundModal
      ? "The room you are looking for does not exist."
      : showRoomIsFullModal
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
      className="baseVertFlex relative min-h-[100dvh] pb-16 tablet:pt-16"
    >
      <AnimatePresence mode={"wait"}>
        {showUsernamePromptModal && room && (
          <motion.div
            key={"usernamePromptModal"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="baseVertFlex w-11/12 gap-4 rounded-md border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 bg-fixed px-8 py-4 text-lightGreen md:w-[500px]"
          >
            <div className="baseVertFlex gap-4">
              <p className="text-nowrap font-semibold">
                Enter a username to join the room
              </p>

              <div className="baseFlex gap-2">
                <Label
                  style={{
                    color: "hsl(120deg 100% 86%)",
                  }}
                >
                  Username
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="username"
                    maxLength={16}
                    onFocus={() => setFocusedInInput(true)}
                    onBlur={() => setFocusedInInput(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
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
                              setShowRoomIsFullModal(true);
                            } else {
                              setShowUsernamePromptModal(false);
                              setConnectedToRoom(true);
                            }
                          },
                        );
                      }
                    }}
                    onChange={(e) => {
                      setUsernameIsProfane(filter.isProfane(e.target.value));

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
                        className="baseVertFlex absolute -right-2 top-11 z-[200] whitespace-nowrap rounded-md border-2 border-red-700 bg-green-700 px-4 py-2 text-sm text-lightGreen shadow-md tablet:right-[-235px] tablet:top-0"
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

            <Button
              icon={<TbDoorEnter size={"1.5rem"} />}
              disabled={usernameIsProfane || username.length === 0}
              isDisabled={usernameIsProfane || username.length === 0}
              innerText={"Join room"}
              iconOnLeft
              className="my-2 gap-2"
              onClickFunction={() =>
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
                      setShowRoomIsFullModal(true);
                    } else {
                      setShowUsernamePromptModal(false);
                      setConnectedToRoom(true);
                    }
                  },
                )
              }
            />
          </motion.div>
        )}

        {connectedToRoom &&
          !showUsernamePromptModal &&
          Object.keys(playerMetadata).length > 1 && (
            <motion.div
              key={"mainJoinRoomContent"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="baseVertFlex relative gap-4"
            >
              <div className="baseFlex sticky left-0 top-0 z-[105] w-screen !justify-start gap-4 border-b-2 border-white bg-gradient-to-br from-green-800 to-green-850 bg-fixed p-2 shadow-lg tablet:relative tablet:w-full tablet:bg-none tablet:shadow-none">
                <Button
                  variant={"secondary"}
                  icon={<BiArrowBack size={"1.25rem"} />}
                  className="h-10 w-10"
                  onClick={() => leaveRoom()}
                />

                <div
                  style={{
                    color: "hsl(120deg 100% 86%)",
                    filter: "drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.2))",
                  }}
                  className="text-xl font-medium"
                >
                  {`${
                    connectedToRoom
                      ? `${Object.values(playerMetadata)[0]?.username}'s room`
                      : "Join room"
                  }`}
                </div>
              </div>

              <div
                style={{
                  color: "hsl(120deg 100% 86%)",
                }}
                className="baseVertFlex gap-4"
              >
                <fieldset className="baseVertFlex mt-4 gap-4 rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 bg-fixed p-4">
                  <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg">
                    <IoSettingsSharp size={"1.25rem"} />
                    Room settings
                  </legend>
                  <div className="grid grid-cols-2 grid-rows-4 items-center gap-x-24 gap-y-2 p-2">
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
                  <SecondaryButton
                    icon={
                      showCheckmark ? (
                        <FiCheck size={"1.25rem"} />
                      ) : (
                        <MdCopyAll size={"1.25rem"} />
                      )
                    }
                    innerText={
                      showCheckmark ? "Invite link copied" : "Copy invite link"
                    }
                    style={{
                      fontSize: "0.875rem",
                      width: "14rem",
                      placeItems: "center",
                      justifyItems: "center",
                    }}
                    extraPadding={false}
                    onClickFunction={() => {
                      navigator.clipboard.writeText(
                        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/join/${roomConfig.code}`,
                      );
                      setShowCheckmark(true);
                      setTimeout(() => setShowCheckmark(false), 1500);
                    }}
                  />
                </fieldset>
                <fieldset className="rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 bg-fixed p-4">
                  <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg">
                    <FaUsers size={"1.25rem"} className="ml-1" />
                    Players
                    <div className="tracking-tighter">{`( ${roomConfig.playersInRoom} / ${roomConfig.maxPlayers} )`}</div>
                  </legend>
                  <div className="baseVertFlex gap-6 p-2">
                    <div
                      className={`sm:baseVertFlex grid grid-cols-2 ${
                        roomConfig.playersInRoom > 2
                          ? "grid-rows-2"
                          : "grid-rows-1"
                      } !items-start !justify-start gap-8 sm:flex sm:!flex-row`}
                    >
                      {Object.keys(playerMetadata)?.map((playerID) => (
                        <PlayerIcon
                          key={playerID}
                          avatarPath={
                            playerMetadata[playerID]?.avatarPath ||
                            "/avatars/rabbit.svg"
                          }
                          borderColor={
                            playerMetadata[playerID]?.color ||
                            "hsl(352deg, 69%, 61%)"
                          }
                          playerID={playerID}
                          playerIsHost={playerID === roomConfig.hostUserID}
                          showAddFriendButton={
                            userID !== playerID &&
                            friendData?.friendIDs?.indexOf(playerID) === -1 &&
                            authenticatedUsers
                              ? authenticatedUsers.findIndex(
                                  (player) => player.id === playerID,
                                ) !== -1
                              : false
                          }
                          username={playerMetadata[playerID]?.username}
                          size={"3rem"}
                          playerMetadata={playerMetadata[playerID]}
                        />
                      ))}
                    </div>

                    <div className="h-[2px] w-full rounded-md bg-white"></div>

                    {viewportLabel === "tablet" ||
                    viewportLabel === "desktop" ? (
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
                          <div className="baseVertFlex gap-4">
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
                        <PlayerCustomizationDrawer />
                      </div>
                    )}
                  </div>
                </fieldset>
                <div className="baseFlex !items-baseline gap-1">
                  <p>
                    waiting for{" "}
                    <span className="font-semibold">
                      {roomConfig.hostUsername}
                    </span>{" "}
                    to start the game
                  </p>
                  <div className="loadingDots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
}

export default JoinRoom;
