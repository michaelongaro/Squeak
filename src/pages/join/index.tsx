import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { IoHome } from "react-icons/io5";
import PublicRooms from "~/components/JoinRoom/PublicRooms";
import PlayerCustomizationSheet from "~/components/sheets/PlayerCustomizationSheet";
import PlayerCustomizationPreview from "~/components/playerIcons/PlayerCustomizationPreview";
import PlayerCustomizationPopover from "~/components/popovers/PlayerCustomizationPopover";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import { MdQuestionMark } from "react-icons/md";
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
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import TutorialDialog from "~/components/dialogs/TutorialDialog";

const obscenityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

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
  const [joinButtonText, setJoinButtonText] = useState<string>("Join");
  const [focusedInInput, setFocusedInInput] = useState<boolean>(false);
  const [usernameIsProfane, setUsernameIsProfane] = useState<boolean>(false);
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);
  const [showTutorialDialog, setShowTutorialDialog] = useState(false);

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
    {
      enabled: Boolean(
        (friendData?.friendInviteIDs ? friendData.friendInviteIDs.length : 0) >
          0,
      ),
    },
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
          push(`join/${roomCode}`);
          setConnectedToRoom(true);
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
    if (
      !joiningRoom &&
      queriedRoom &&
      typeof queriedRoom !== "string" &&
      !connectedToRoom
    ) {
      setJoiningRoom(true);
      setTimeout(() => {
        joinRoom();
        ctx.rooms.findRoomByCode.reset();
      }, 500);
    } else if (typeof queriedRoom === "string") {
      setTimeout(() => {
        setJoinButtonText(queriedRoom);

        setTimeout(() => {
          setJoinButtonText("Join");
          ctx.rooms.findRoomByCode.reset(); // clearing trpc cache so that the error message
          // can be shown again if the user tries to join the same room
        }, 2000);
      }, 1000);
    }
  }, [
    queriedRoom,
    connectedToRoom,
    joiningRoom,
    joinRoom,
    setRoomConfig,
    ctx.rooms.findRoomByCode,
  ]);

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
      className="baseVertFlex relative min-h-[100dvh] !justify-start pb-16 tablet:!justify-center tablet:pt-16"
    >
      <div className="baseVertFlex relative gap-4">
        <div className="baseFlex sticky left-0 top-0 z-[105] w-screen !justify-start gap-4 border-b-2 border-white bg-gradient-to-br from-green-800 to-green-850 p-2 shadow-lg tablet:relative tablet:w-full tablet:bg-none tablet:shadow-none">
          <Button
            variant={"secondary"}
            className="size-10"
            onClick={() => leaveRoom()}
          >
            <IoHome size={"1.25rem"} />
          </Button>

          <div
            style={{
              filter: "drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.2))",
            }}
            className="text-xl font-medium text-lightGreen"
          >
            Join room
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

        <div className="baseVertFlex mt-4 gap-8 rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 p-4 text-lightGreen">
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
                    setUsernameIsProfane(
                      obscenityMatcher.hasMatch(e.target.value),
                    );

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
                      key={"joinRoomProfanityWarning"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="baseVertFlex absolute -right-2 top-11 z-[200] whitespace-nowrap rounded-md border-2 border-[hsl(0,84%,60%)] bg-gradient-to-br from-red-50 to-red-100 px-4 py-2 text-sm text-[hsl(0,84%,40%)] shadow-md tablet:right-[-255px] tablet:top-0"
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
                type="tel"
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
                <p className="mt-[0.3rem] text-lightGreen">Avatar</p>
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

        <div className="baseFlex relative h-full w-full">
          <Button
            disabled={
              joinButtonText !== "Join" ||
              playerMetadata[userID]?.username.length === 0 ||
              roomCode.length === 0 ||
              usernameIsProfane
            }
            onClick={() => {
              setJoinButtonText("Joining");
              searchForRoom();
            }}
            className={`h-11 font-medium !transition-all ${
              joinButtonText === "Game has already started."
                ? "w-[250px]"
                : "w-[175px]"
            }`}
          >
            <AnimatePresence mode={"popLayout"} initial={false}>
              <motion.div
                key={joinButtonText}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                  duration: 0.25,
                }}
                className={`baseFlex gap-3 ${
                  joinButtonText === "Room not found." ||
                  joinButtonText === "Room is full." ||
                  joinButtonText === "Game has already started."
                    ? "w-[175px]"
                    : "w-[122.75px]"
                }`}
              >
                {joinButtonText}
                {joinButtonText === "Joining" && (
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
        </div>

        <div className="baseFlex w-full px-8">
          <PublicRooms />
        </div>
      </div>
    </motion.div>
  );
}

export default JoinRoom;
