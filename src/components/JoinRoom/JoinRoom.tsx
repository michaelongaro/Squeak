import { useState, useEffect, useCallback } from "react";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import { type IRoomPlayer, type IGameMetadata } from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";
import PlayerIcon from "../playerIcons/PlayerIcon";
import SecondaryButton from "../Buttons/SecondaryButton";
import { IoHome } from "react-icons/io5";
import { BiArrowBack } from "react-icons/bi";
import PrimaryButton from "../Buttons/PrimaryButton";
import { MdCopyAll } from "react-icons/md";
import { FiCheck } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import PublicRooms from "./PublicRooms";
import { IoSettingsSharp } from "react-icons/io5";
import { FaUsers } from "react-icons/fa";
import Filter from "bad-words";
import { useSession } from "next-auth/react";
import { type Room } from "@prisma/client";
import useLeaveRoom from "../../hooks/useLeaveRoom";

import classes from "./JoinRoom.module.css";

const filter = new Filter();

function JoinRoom() {
  const { status } = useSession();
  const userID = useUserIDContext();

  const {
    playerMetadata,
    setPlayerMetadata,
    roomConfig,
    setRoomConfig,
    setGameData,
    setPageToRender,
    connectedToRoom,
    setConnectedToRoom,
    friendData,
  } = useRoomContext();

  const leaveRoom = useLeaveRoom();

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

  const { data: roomInviteIDs } = trpc.users.getUsersFromIDList.useQuery(
    friendData?.roomInviteIDs ?? []
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

    // if player has invite(s) to this room, remove them
    if (roomInviteIDs) {
      for (const friend of roomInviteIDs) {
        if (friend.roomCode === roomCode) {
          socket.emit("modifyFriendData", {
            action: "acceptRoomInvite",
            initiatorID: userID,
            targetID: friend.id,
            roomCode: roomCode,
            currentRoomIsPublic: queriedRoom.isPublic,
          });
        }
      }
    }
  }, [roomCode, userID, playerMetadata, queriedRoom, status, roomInviteIDs]);

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
    // rough way to check whether store data has been initialized
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

    socket.on("navigateToPlayScreen", (initGameData: IGameMetadata) => {
      setPageToRender("play");
      setGameData(initGameData);
    });

    return () => {
      socket.off("playerMetadataUpdated", (newUsers) =>
        setPlayerMetadata(newUsers)
      );
      socket.off("roomConfigUpdated", (roomConfig) =>
        setRoomConfig(roomConfig)
      );
      socket.off("navigateToPlayScreen", (initGameData: IGameMetadata) => {
        setPageToRender("play");
        setGameData(initGameData);
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
      className="baseVertFlex relative min-h-[100dvh]"
    >
      <div className="baseVertFlex relative gap-4">
        <div className="absolute left-0 top-0">
          <SecondaryButton
            icon={
              connectedToRoom ? (
                <BiArrowBack size={"1.5rem"} />
              ) : (
                <IoHome size={"1.5rem"} />
              )
            }
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
              className="baseVertFlex mt-4 gap-8 rounded-md border-2 border-white bg-green-800 p-4"
            >
              <div className="baseVertFlex gap-4">
                <div className="baseFlex w-full !justify-between gap-4">
                  <label>Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="username"
                      className=" rounded-md py-1 pl-2 text-green-800"
                      maxLength={16}
                      onFocus={() => setFocusedInInput(true)}
                      onBlur={() => setFocusedInInput(false)}
                      onChange={(e) => {
                        setUsernameIsProfane(filter.isProfane(e.target.value));

                        setPlayerMetadata({
                          ...playerMetadata,
                          [userID]: {
                            ...playerMetadata[userID],
                            username: e.target.value,
                          } as IRoomPlayer,
                        });
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
                      className="absolute right-1 top-[-0.25rem] text-xl text-red-600 transition-opacity"
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

                <div className="baseFlex w-full !justify-between gap-4">
                  <label>Room code</label>
                  <input
                    type="text"
                    placeholder="optional"
                    className={`rounded-md py-1 pl-2 text-green-800 ${
                      roomCode.length === 0 ? "italic" : ""
                    }`}
                    maxLength={6}
                    onChange={(e) => setRoomCode(e.target.value)}
                    value={roomCode}
                  />
                </div>
              </div>

              <div className="baseFlex gap-12">
                <PickerTooltip type={"avatar"} />
                <PickerTooltip type={"color"} />
              </div>
            </div>

            <div
              style={{
                animation: showAnimation
                  ? "errorAnimation 0.65s linear"
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
                width={"12rem"}
                height={"3rem"}
                onClickFunction={() => setSubmittedRoomCode(roomCode)}
                showLoadingSpinnerOnClick={true}
              />

              <AnimatePresence mode={"wait"}>
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
                    className="pointer-events-none absolute right-10 rounded-md border-2 border-white bg-green-800 px-4 py-2 shadow-md"
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
            <fieldset className="mt-4 rounded-md  border-2 border-white bg-green-800 p-4">
              <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg">
                Room settings
                <IoSettingsSharp size={"1.25rem"} />
              </legend>
              <div className="grid grid-cols-2 grid-rows-4 items-center gap-x-24 gap-y-0 p-2">
                <div>Points to win:</div>
                {roomConfig?.pointsToWin}

                <div>Players:</div>
                {roomConfig?.maxPlayers}

                <div>Room visibility:</div>
                {roomConfig?.isPublic ? "Public" : "Private"}

                <div>Room code:</div>
                <div className="baseFlex !justify-start gap-4">
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
                <FaUsers size={"1.25rem"} />
              </legend>
              <div className="baseVertFlex gap-6 p-2">
                <div className="baseVertFlex !justify-start gap-8 sm:!flex-row sm:!items-start">
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

                <div className="baseFlex gap-12">
                  <PickerTooltip type={"avatar"} openAbove={true} />
                  <PickerTooltip type={"color"} openAbove={true} />
                </div>
              </div>
            </fieldset>
            <div className="baseFlex !items-baseline gap-1">
              <p>
                waiting for{" "}
                <span className="font-semibold">{roomConfig.hostUsername}</span>{" "}
                to start the game
              </p>
              <div className={classes.loadingDots}>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default JoinRoom;
