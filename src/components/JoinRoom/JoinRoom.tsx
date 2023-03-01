import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { type IRoomPlayer, type IGameMetadata } from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";
import PlayerIcon from "../playerIcons/PlayerIcon";
import SecondaryButton from "../Buttons/SecondaryButton";
import { BiArrowBack } from "react-icons/bi";
import PrimaryButton from "../Buttons/PrimaryButton";
import { MdCopyAll } from "react-icons/md";
import { FiCheck } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import PublicRooms from "./PublicRooms";
import Filter from "bad-words";
import { useSession } from "next-auth/react";
import { type Room } from "@prisma/client";

const filter = new Filter();

function JoinRoom() {
  const {
    roomConfig,
    setRoomConfig,
    playerMetadata,
    setPlayerMetadata,
    friendData,
    connectedToRoom,
    setConnectedToRoom,
    setGameData,
    setPageToRender,
    leaveRoom,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();
  const { data: session, status } = useSession();

  const [roomCode, setRoomCode] = useState<string>("");
  const [submittedRoomCode, setSubmittedRoomCode] = useState<string>("");
  const [showCheckmark, setShowCheckmark] = useState<boolean>(false);
  const [focusedInInput, setFocusedInInput] = useState<boolean>(false);
  const [usernameIsProfane, setUsernameIsProfane] = useState<boolean>(false);

  const [room, setRoom] = useState<Room | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);

  const { data: queriedRoom } = trpc.rooms.findRoomByCode.useQuery(
    submittedRoomCode,
    {
      refetchOnWindowFocus: false,
    }
  );

  const { data: authenticatedUsers } = trpc.users.getUsersFromIDList.useQuery(
    Object.keys(playerMetadata)
  );

  const joinRoom = useCallback(() => {
    socket.emit("joinRoom", {
      userID,
      code: roomCode,
      playerMetadata: playerMetadata[userID],
    });

    if (
      !queriedRoom ||
      typeof queriedRoom === "string" ||
      status !== "authenticated"
    )
      return;

    socket.emit("modifyFriendData", {
      action: "joinRoom",
      initiatorID: userID,
      roomCode: roomCode,
      currentRoomIsPublic: queriedRoom.isPublic,
    });
  }, [roomCode, userID, playerMetadata, queriedRoom, status]);

  useEffect(() => {
    if (queriedRoom && typeof queriedRoom !== "string") {
      setRoom(queriedRoom);
      setRoomError(null);
    } else if (typeof queriedRoom === "string") {
      setRoomError(queriedRoom);
      setShowAnimation(true);
    }
  }, [queriedRoom]);

  useEffect(() => {
    // rough way to check whether context data has been initialized
    if (room && !connectedToRoom) {
      setRoomConfig(room);
      setSubmittedRoomCode("");
      joinRoom();
      setConnectedToRoom(true);

      // reset room data once connected to room
      setRoomCode("");
      setSubmittedRoomCode("");
      setRoom(null);
      setRoomError(null);
    }
  }, [connectedToRoom, setConnectedToRoom, joinRoom, setRoomConfig, room]);

  useEffect(() => {
    socket.on("playerMetadataUpdated", (newUsers) =>
      setPlayerMetadata(newUsers)
    );

    socket.on("roomConfigUpdated", (roomConfig) => setRoomConfig(roomConfig));

    socket.on("navigateToPlayScreen", () => {
      setGameData({} as IGameMetadata);
      setPageToRender("play");
    });

    return () => {
      socket.off("playerMetadataUpdated", (newUsers) =>
        setPlayerMetadata(newUsers)
      );
      socket.off("roomConfigUpdated", (roomConfig) =>
        setRoomConfig(roomConfig)
      );
      socket.off("navigateToPlayScreen", () => {
        setGameData({} as IGameMetadata);
        setPageToRender("play");
      });
    };
  }, []);

  return (
    <motion.div
      key={"joinRoom"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseVertFlex relative min-h-[100vh]"
    >
      <div className="baseVertFlex relative gap-2 ">
        <div className="absolute top-0 left-0">
          <SecondaryButton
            icon={<BiArrowBack size={"1.5rem"} />}
            extraPadding={false}
            onClickFunction={() => leaveRoom(connectedToRoom ? false : true)}
          />
        </div>

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
        {!connectedToRoom ? (
          <>
            <div
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="baseVertFlex mt-4 gap-4 rounded-md border-2 border-white bg-green-800 p-4"
            >
              <div className="baseFlex w-full !justify-between gap-2">
                <label>Username</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="username"
                    className=" rounded-sm pl-2 text-green-800"
                    maxLength={16}
                    onFocus={() => setFocusedInInput(true)}
                    onBlur={() => setFocusedInInput(false)}
                    onChange={(e) => {
                      setUsernameIsProfane(filter.isProfane(e.target.value));

                      setPlayerMetadata((prevMetadata) => ({
                        ...prevMetadata,
                        [userID]: {
                          ...prevMetadata[userID],
                          username: e.target.value,
                        } as IRoomPlayer,
                      }));
                    }}
                    value={playerMetadata[userID]?.username}
                  />
                  <div
                    style={{
                      opacity:
                        focusedInInput ||
                        playerMetadata[userID]?.username?.length === 0
                          ? 1
                          : 0,
                    }}
                    className="absolute top-[-0.25rem] right-1 text-xl text-red-600 transition-all"
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
                        style={{
                          right: "-255px",
                          color: "hsl(120deg 100% 86%)",
                        }}
                        className="baseVertFlex absolute top-0 gap-2 rounded-md border-2 border-red-700 bg-green-700 pt-2 pb-2 pr-1 pl-1 shadow-md"
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

              <div className="baseFlex w-full !justify-between gap-2">
                <label>Room code</label>
                <input
                  type="text"
                  placeholder="optional"
                  className=" rounded-sm pl-2 text-green-800"
                  maxLength={6}
                  onChange={(e) => setRoomCode(e.target.value)}
                  value={roomCode}
                />
              </div>

              <div className="baseFlex gap-12">
                <PickerTooltip type={"avatar"} />
                <PickerTooltip type={"color"} />
              </div>
            </div>

            <div
              style={{
                animation: showAnimation
                  ? "errorAnimation 0.55s linear"
                  : "none",
              }}
              className="baseFlex relative h-full w-full"
              onAnimationEnd={() => {
                setShowAnimation(false);
                setTimeout(() => {
                  setRoomError(null);
                }, 1000);
              }}
            >
              <PrimaryButton
                innerText={"Join"}
                innerTextWhenLoading={"Joining"}
                disabled={
                  playerMetadata[userID]?.username.length === 0 ||
                  roomCode.length === 0 ||
                  usernameIsProfane
                }
                width={"20rem"}
                height={"4rem"}
                onClickFunction={() => setSubmittedRoomCode(roomCode)}
                showLoadingSpinnerOnClick={true}
              />

              <AnimatePresence
                initial={false}
                mode={"wait"}
                onExitComplete={() => null}
              >
                {roomError && (
                  <motion.div
                    key={"joinRoomError"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      color: "hsl(120deg 100% 86%)",
                    }}
                    className="pointer-events-none absolute right-[-20px] rounded-md border-2 border-white bg-green-800 p-4 shadow-md transition-all"
                  >
                    {roomError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <PublicRooms />
          </>
        ) : (
          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseVertFlex gap-4"
          >
            <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800  p-4">
              <legend className="pl-4 pr-4 text-left text-lg">
                Room settings
              </legend>
              <div className="grid grid-cols-2 grid-rows-4 items-center gap-x-24 gap-y-0 p-4">
                <div>Points to win:</div>
                {roomConfig?.pointsToWin}

                <div>Players:</div>
                {roomConfig?.maxPlayers}

                <div>Room visibility:</div>
                {roomConfig?.isPublic ? "Public" : "Private"}

                <div>Room code:</div>
                <div className="baseFlex !justify-start gap-2">
                  {roomConfig?.code}
                  <SecondaryButton
                    icon={
                      showCheckmark ? (
                        <FiCheck size={"1.5rem"} />
                      ) : (
                        <MdCopyAll size={"1.5rem"} />
                      )
                    }
                    extraPadding={false}
                    onClickFunction={() => {
                      navigator.clipboard.writeText(roomConfig.code);
                      setShowCheckmark(true);
                      setTimeout(() => setShowCheckmark(false), 1000);
                    }}
                  />
                </div>
              </div>
            </fieldset>
            <fieldset className="rounded-md border-2 border-white bg-green-800 p-4">
              <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg">
                Players
                <div className="tracking-widest">{`(${roomConfig.playersInRoom}/${roomConfig.maxPlayers})`}</div>
              </legend>
              <div className="baseVertFlex gap-6 p-4">
                <div className="baseFlex gap-8">
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
                    />
                  ))}
                </div>

                <div className="h-[2px] w-full rounded-md bg-white"></div>

                <div className="baseFlex gap-12">
                  <PickerTooltip type={"avatar"} openAbove={true} />
                  <PickerTooltip type={"color"} openAbove={true} />
                </div>
              </div>
            </fieldset>
            {`waiting for ${roomConfig.hostUsername} to start the game`}
            {/* starting game + spinner */}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default JoinRoom;
