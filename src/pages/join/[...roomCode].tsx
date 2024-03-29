import { useAuth } from "@clerk/nextjs";
import { PrismaClient, type Room } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { BiArrowBack } from "react-icons/bi";
import { FaUsers } from "react-icons/fa";
import { TbDoorEnter } from "react-icons/tb";
import { FiCheck } from "react-icons/fi";
import { IoHome, IoSettingsSharp } from "react-icons/io5";
import { IoWarningOutline } from "react-icons/io5";
import { MdCopyAll } from "react-icons/md";
import type { GetServerSideProps } from "next";
import SecondaryButton from "~/components/Buttons/SecondaryButton";
import PlayerCustomizationDrawer from "~/components/drawers/PlayerCustomizationDrawer";
import PlayerCustomizationPreview from "~/components/playerIcons/PlayerCustomizationPreview";
import PlayerIcon from "~/components/playerIcons/PlayerIcon";
import PlayerCustomizationPopover from "~/components/popovers/PlayerCustomizationPopover";
import { Button } from "~/components/ui/button";
import useGetViewportLabel from "~/hooks/useGetViewportLabel";
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
import classes from "~/components/JoinRoom/JoinRoom.module.css";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import Head from "next/head";
const filter = new Filter();

function JoinRoom({ room }: { room: Room | null }) {
  const { isLoaded, isSignedIn } = useAuth();
  const userID = useUserIDContext();
  const { push } = useRouter();

  const {
    playerMetadata,
    setPlayerMetadata,
    roomConfig,
    setRoomConfig,
    setGameData,
    connectedToRoom,
    setConnectedToRoom,
    friendData,
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

  const viewportLabel = useGetViewportLabel();

  const { data: authenticatedUsers } = api.users.getUsersFromIDList.useQuery(
    Object.keys(playerMetadata)
  );

  useEffect(() => {
    function handlePlayerMetadataUpdated(newUsers: IRoomPlayersMetadata) {
      setPlayerMetadata(newUsers);
    }

    function handleRoomConfigUpdated(roomConfig: IRoomConfig) {
      setRoomConfig(roomConfig);
    }

    function handleNavigateToPlayScreen(initGameData: IGameMetadata) {
      push(`/game/${roomConfig.code}`);
      setGameData(initGameData);
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
        }
      );

      setConnectedToRoom(true);
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

    // player wasn't a part of the room, room is full
    else if (room && room.playerIDsInRoom.length >= room.maxPlayers) {
      setShowRoomIsFullModal(true);
    }

    // player wasn't a part of the room, game already started
    else if (room && room.gameStarted) {
      setShowGameAlreadyStartedModal(true);
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
    if (room === null) {
      setShowRoomNotFoundModal(true);
    }

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

  if (showRoomNotFoundModal) {
    return <RoomNotFound />;
  }

  if (showRoomIsFullModal) {
    return <RoomIsFull />;
  }

  if (showGameAlreadyStartedModal) {
    return <GameAlreadyStarted />;
  }

  return (
    <motion.div
      key={"joinedRoom"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseVertFlex relative min-h-[100dvh] py-16"
    >
      <Head>
        <title>Join | Squeak</title>
      </Head>

      <AnimatePresence mode={"wait"}>
        {showUsernamePromptModal && room && (
          <motion.div
            key={"usernamePromptModal"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="baseVertFlex w-10/12 gap-4 rounded-md border-2 border-lightGreen bg-green-800 p-4 text-lightGreen md:w-[500px]"
          >
            <div className="baseVertFlex gap-4">
              <p className="font-semibold">Enter a username to join the room</p>

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
                    onChange={(e) => {
                      setUsernameIsProfane(filter.isProfane(e.target.value));

                      setUsername(e.target.value);
                    }}
                    value={username}
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
                        key={"createRoomProfanityWarning"}
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
              className="gap-2"
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
                  }
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
              transition={{ duration: 0.15 }}
              className="baseVertFlex relative gap-4"
            >
              <div className="absolute left-4 top-0 sm:left-0">
                <Button
                  variant={"secondary"}
                  icon={<BiArrowBack size={"1.5rem"} />}
                  className="h-10 w-10"
                  onClick={() => leaveRoom()}
                />
              </div>

              <div
                style={{
                  color: "hsl(120deg 100% 86%)",
                  filter: "drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.2))",
                }}
                className="mt-1.5 text-xl font-medium"
              >
                {`${
                  connectedToRoom
                    ? `${Object.values(playerMetadata)[0]?.username}'s room`
                    : "Join room"
                }`}
              </div>

              <div
                style={{
                  color: "hsl(120deg 100% 86%)",
                }}
                className="baseVertFlex gap-4"
              >
                <fieldset className="baseVertFlex mt-4 gap-4 rounded-md  border-2 border-white bg-green-800 p-4">
                  <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg">
                    Room settings
                    <IoSettingsSharp size={"1.25rem"} />
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
                        <FiCheck size={"1.5rem"} />
                      ) : (
                        <MdCopyAll size={"1.5rem"} />
                      )
                    }
                    innerText={
                      showCheckmark ? "Invite link copied" : "Copy invite link"
                    }
                    style={{
                      width: "14rem",
                      placeItems: "center",
                      justifyItems: "center",
                    }}
                    extraPadding={false}
                    onClickFunction={() => {
                      navigator.clipboard.writeText(
                        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/join/${roomConfig.code}`
                      );
                      setShowCheckmark(true);
                      setTimeout(() => setShowCheckmark(false), 1000);
                    }}
                  />
                </fieldset>
                <fieldset className="rounded-md border-2 border-white bg-green-800 p-4">
                  <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg">
                    Players
                    <div className="tracking-widest">{`(${roomConfig.playersInRoom}/${roomConfig.maxPlayers})`}</div>
                    <FaUsers size={"1.25rem"} />
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
                          showAddFriendButton={
                            userID !== playerID &&
                            friendData?.friendIDs?.indexOf(playerID) === -1 &&
                            authenticatedUsers
                              ? authenticatedUsers.findIndex(
                                  (player) => player.id === playerID
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
                  <div className={classes.loadingDots}>
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const prisma = new PrismaClient();

  if (
    ctx.params?.roomCode &&
    typeof ctx.params.roomCode === "string" &&
    ctx.params.roomCode.length !== 6
  ) {
    return {
      props: {
        room: null,
      },
    };
  }

  const roomCode = ctx.params?.roomCode;

  const room = await prisma.room.findUnique({
    where: {
      code: roomCode ? roomCode[0] : "",
    },
  });

  return {
    props: {
      room: JSON.parse(JSON.stringify(room)) as Room,
    },
  };
};

function RoomNotFound() {
  const router = useRouter();

  return (
    <div className="baseVertFlex min-h-[100dvh] py-16">
      <div className="baseVertFlex w-10/12 gap-4 rounded-md border-2 border-lightGreen bg-green-800 p-4 text-lightGreen md:w-[500px] md:p-8">
        <div className="baseFlex gap-2">
          <IoWarningOutline className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Room not found</h1>
        </div>
        <p className="text-center text-lg">
          The room you are looking for does not exist.
        </p>

        <Button
          icon={<IoHome size={"1.5rem"} />}
          innerText={"Return to homepage"}
          iconOnLeft
          onClickFunction={() => router.push("/")}
          className="mt-4 gap-2"
        />
      </div>
    </div>
  );
}

function RoomIsFull() {
  const router = useRouter();

  return (
    <div className="baseVertFlex min-h-[100dvh] py-16">
      <div className="baseVertFlex w-10/12 gap-4 rounded-md border-2 border-lightGreen bg-green-800 p-4 text-lightGreen md:w-[500px]  md:p-8">
        <div className="baseFlex gap-2">
          <IoWarningOutline className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Room is full</h1>
        </div>
        <p className="text-center text-lg">
          The room you are trying to join is full.
        </p>

        <Button
          icon={<IoHome size={"1.5rem"} />}
          innerText={"Return to homepage"}
          iconOnLeft
          onClickFunction={() => router.push("/")}
          className="mt-4 gap-2"
        />
      </div>
    </div>
  );
}

function GameAlreadyStarted() {
  const router = useRouter();

  return (
    <div className="baseVertFlex min-h-[100dvh] py-16">
      <div className="baseVertFlex w-10/12 gap-4 rounded-md border-2 border-lightGreen bg-green-800 p-4 text-lightGreen md:w-[500px] md:p-8">
        <div className="baseFlex gap-2">
          <IoWarningOutline className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Game in progress</h1>
        </div>
        <p className="text-center text-lg">
          The room you are trying to join is has already started its game.
        </p>

        <Button
          icon={<IoHome size={"1.5rem"} />}
          innerText={"Return to homepage"}
          iconOnLeft
          onClickFunction={() => router.push("/")}
          className="mt-4 gap-2"
        />
      </div>
    </div>
  );
}
