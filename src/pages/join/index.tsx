import { useAuth } from "@clerk/nextjs";
import Filter from "bad-words";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { IoHome } from "react-icons/io5";
import PrimaryButton from "~/components/Buttons/PrimaryButton";
import PublicRooms from "~/components/JoinRoom/PublicRooms";
import PlayerCustomizationDrawer from "~/components/drawers/PlayerCustomizationDrawer";
import PlayerCustomizationPreview from "~/components/playerIcons/PlayerCustomizationPreview";
import PlayerCustomizationPopover from "~/components/popovers/PlayerCustomizationPopover";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import useLeaveRoom from "../../hooks/useLeaveRoom";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../pages/api/socket";
import { useRouter } from "next/router";
import { type IRoomConfig } from "~/pages/create";

const filter = new Filter();

function JoinRoom() {
  const { isSignedIn } = useAuth();
  const userID = useUserIDContext();
  const { push } = useRouter();

  const ctx = api.useUtils();

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
    routeToNavigateTo: "/",
  });

  const [roomCode, setRoomCode] = useState<string>("");

  const [focusedInInput, setFocusedInInput] = useState<boolean>(false);
  const [usernameIsProfane, setUsernameIsProfane] = useState<boolean>(false);

  const [roomError, setRoomError] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);

  const { data: queriedRoom, refetch: searchForRoom } =
    api.rooms.findRoomByCode.useQuery(
      {
        roomCode,
      },
      {
        enabled: false,
        refetchOnWindowFocus: false,
      },
    );

  const { data: roomInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.roomInviteIDs ?? [],
  );

  const joinRoom = useCallback(() => {
    socket.emit(
      "joinRoom",
      {
        userID,
        code: roomCode,
        playerMetadata: playerMetadata[userID],
      },
      (response?: "roomIsFull") => {
        if (response !== "roomIsFull") {
          setConnectedToRoom(true);
          push(`join/${roomCode}`);
        }
      },
    );

    if (!queriedRoom || typeof queriedRoom === "string" || !isSignedIn) return;

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
  }, [
    roomCode,
    userID,
    playerMetadata,
    queriedRoom,
    isSignedIn,
    roomInviteIDs,
    push,
    setConnectedToRoom,
  ]);

  useEffect(() => {
    if (queriedRoom && typeof queriedRoom !== "string" && !connectedToRoom) {
      setRoomConfig(queriedRoom);
      joinRoom();

      setRoomError(null);
    } else if (typeof queriedRoom === "string") {
      setRoomError(queriedRoom);
      setShowAnimation(true);
    }
  }, [queriedRoom, connectedToRoom, joinRoom, setRoomConfig]);

  // TODO: not sure if this will refire & work as expected when player actually joins room socket wise
  useEffect(() => {
    function handleRoomConfigUpdated(roomConfig: IRoomConfig) {
      setRoomConfig(roomConfig);
    }

    function handlePlayerMetadataUpdated(playerMetadata: IRoomPlayersMetadata) {
      setPlayerMetadata(playerMetadata);
    }

    socket.on("roomConfigUpdated", handleRoomConfigUpdated);
    socket.on("playerMetadataUpdated", handlePlayerMetadataUpdated);

    return () => {
      socket.off("roomConfigUpdated", handleRoomConfigUpdated);
      socket.off("playerMetadataUpdated", handlePlayerMetadataUpdated);
    };
  }, [
    setConnectedToRoom,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
    push,
    roomConfig.code,
    roomConfig.code,
    roomConfig.playerIDsInRoom,
    userID,
  ]);

  return (
    <motion.div
      key={"baseJoinRoom"}
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
            icon={<IoHome size={"1.25rem"} />}
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
            Join room
          </div>
        </div>

        <div
          style={{
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseVertFlex mt-4 gap-8 rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 p-4"
        >
          <div className="baseVertFlex !items-start gap-4">
            <div className="baseFlex w-full !justify-between gap-5">
              <label>Username</label>
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

            <div className="baseFlex !justify-between gap-3">
              <label>Room code</label>
              <Input
                type="text"
                placeholder="optional"
                className={`${
                  roomCode.length === 0 ? "italic text-gray-300" : ""
                } w-[120px]`}
                maxLength={6}
                onChange={(e) => setRoomCode(e.target.value)}
                value={roomCode}
              />
            </div>
          </div>

          {viewportLabel === "tablet" || viewportLabel === "desktop" ? (
            <div className="baseFlex gap-12">
              <div className="baseVertFlex gap-2">
                <PlayerCustomizationPopover type={"avatar"} />
                <p className="mt-[0.25rem] text-lightGreen">Avatar</p>
              </div>
              <div className="baseVertFlex gap-2">
                <PlayerCustomizationPopover type={"front"} />
                <p className="text-lightGreen">Front</p>
              </div>
              <div className="baseVertFlex gap-2">
                <PlayerCustomizationPopover type={"back"} />
                <p className="text-lightGreen">Back</p>
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
              <PlayerCustomizationDrawer />
            </div>
          )}
        </div>

        <div
          style={{
            animation: showAnimation ? "errorAnimation 0.65s linear" : "none",
          }}
          className="baseFlex relative h-full w-full"
          onAnimationEnd={() => {
            setShowAnimation(false);
            setTimeout(() => {
              setRoomError(null);
              ctx.rooms.findRoomByCode.reset(); // clearing trpc cache so that the error message
              // can be shown again if the user tries to join the same room
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
            onClickFunction={() => searchForRoom()}
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
                className="pointer-events-none absolute right-10 rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 px-4 py-2 shadow-md"
              >
                {roomError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <PublicRooms />
      </div>
    </motion.div>
  );
}

export default JoinRoom;
