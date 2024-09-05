import { useState, useEffect, useRef } from "react";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import { FiMail } from "react-icons/fi";
import { FaUserFriends } from "react-icons/fa";
import { useUserIDContext } from "../../context/UserIDContext";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";
import { TbDoorEnter } from "react-icons/tb";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { FaMagnifyingGlass } from "react-icons/fa6";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/router";
import { useMainStore } from "~/stores/MainStore";

interface IFriendsList {
  setShowFriendsListDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

function FriendsList({ setShowFriendsListDialog }: IFriendsList) {
  const userID = useUserIDContext();
  const { push } = useRouter();

  const {
    connectedToRoom,
    friendData,
    newInviteNotification,
    setNewInviteNotification,
    roomConfig,
  } = useMainStore((state) => ({
    connectedToRoom: state.connectedToRoom,
    friendData: state.friendData,
    newInviteNotification: state.newInviteNotification,
    setNewInviteNotification: state.setNewInviteNotification,
    roomConfig: state.roomConfig,
  }));

  const { data: friends } = api.users.getUsersFromIDList.useQuery(
    friendData?.friendIDs ?? [],
    {
      refetchOnWindowFocus: true,
    },
  );
  const { data: friendInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.friendInviteIDs ?? [],
    {
      refetchOnWindowFocus: true,
    },
  );
  const { data: roomInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.roomInviteIDs ?? [],
    {
      refetchOnWindowFocus: true,
    },
  );

  const [openPopoverID, setOpenPopoverID] = useState("");
  const [viewState, setViewState] = useState<"friends" | "pending">("friends");

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // clears red notification dot if it exists
    if (newInviteNotification) {
      setNewInviteNotification(false);
    }
  }, [newInviteNotification, setNewInviteNotification]);

  useOnClickOutside({
    ref: modalRef,
    setShowDialog: setShowFriendsListDialog,
  });

  return (
    <motion.div
      key={"friendsListDialog"}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      ref={modalRef}
      className="baseVertFlex absolute right-0 top-16 w-[400px] !items-start gap-2 rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850"
    >
      <div className="baseFlex w-full border-b-2 border-white">
        <Button
          variant={viewState === "friends" ? "default" : "secondary"}
          onClick={() => setViewState("friends")}
          className="baseFlex w-[200px] gap-2 rounded-none rounded-tl-sm border-r-2 !border-none border-white"
        >
          <FaUserFriends size={"1.25rem"} />
          Friends
          {friends !== undefined && (
            <div className="baseFlex gap-[0.1rem]">
              <div>(</div>
              <div>{friends.length}</div>
              <div>)</div>
            </div>
          )}
        </Button>

        <Button
          variant={viewState === "pending" ? "default" : "secondary"}
          onClick={() => setViewState("pending")}
          className="baseFlex w-[200px] gap-2 rounded-none rounded-tr-sm !border-none"
        >
          <FiMail size={"1.25rem"} />
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
        </Button>
      </div>

      <div className="baseVertFlex h-72 w-full !items-start !justify-start gap-2 overflow-hidden">
        <AnimatePresence mode={"popLayout"} initial={false}>
          {friends === undefined ||
          friendInviteIDs === undefined ||
          roomInviteIDs === undefined ? (
            <motion.div
              key={"loadingSpinner"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="baseFlex h-72 w-full"
            >
              <div
                className="inline-block size-8 animate-spin rounded-full border-[2px] border-lightGreen border-t-transparent text-lightGreen"
                role="status"
                aria-label="loading"
              >
                <span className="sr-only">Loading...</span>
              </div>
            </motion.div>
          ) : (
            <>
              {viewState === "friends" ? (
                <motion.div
                  key={"friendsListContent"}
                  initial={{ opacity: 0, x: "-20%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "-20%" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="baseVertFlex min-h-72 w-full !items-start !justify-start gap-4 overflow-auto p-2"
                >
                  <>
                    {friends.length === 0 ? (
                      <div className="baseVertFlex h-72 w-full gap-4 text-lightGreen">
                        <FaMagnifyingGlass className="size-6" />
                        You have no friends yet.
                      </div>
                    ) : (
                      <>
                        {friends
                          .sort(
                            (
                              { online: onlineA = false },
                              { online: onlineB = false },
                            ) => Number(onlineB) - Number(onlineA),
                          )
                          .map((friend, index) => (
                            <div
                              key={friend.userId}
                              style={{
                                zIndex: friends.length - index,
                              }}
                              className="baseFlex w-full !justify-start gap-4 pl-2 transition-all"
                            >
                              <div className="baseFlex !shrink-0 gap-4">
                                <PlayerIcon
                                  avatarPath={friend.avatarPath}
                                  borderColor={friend.color}
                                  size={"2.75rem"}
                                  onlineStatus={friend.online}
                                />
                                <div className="baseVertFlex !items-start text-lightGreen">
                                  {friend.username}
                                  {friend.online && (
                                    <div className="text-sm opacity-70">
                                      {friend.status}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div
                                className={`baseFlex ${
                                  friend.username.length > 13
                                    ? "gap-2"
                                    : "gap-4 pl-2"
                                }`}
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant={"secondary"}
                                        disabled={
                                          !friend.online ||
                                          friend.status === "in a game" ||
                                          !connectedToRoom ||
                                          friend.roomCode === roomConfig.code
                                        }
                                        className="size-9 rounded-full !p-0"
                                        onClick={() =>
                                          socket.volatile.emit(
                                            "modifyFriendData",
                                            {
                                              action: "sendRoomInvite",
                                              initiatorID: userID,
                                              targetID: friend.userId,
                                            },
                                          )
                                        }
                                      >
                                        <FiMail size={"1.25rem"} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side={"bottom"}
                                      sideOffset={8}
                                      className="border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 text-lightGreen"
                                    >
                                      <p>Invite to room</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant={"secondary"}
                                        disabled={
                                          !friend.online ||
                                          friend.roomCode === null ||
                                          friend.roomCode === roomConfig.code ||
                                          friend.status === "in a game" ||
                                          !friend.currentRoomIsPublic ||
                                          friend.currentRoomIsFull === true
                                        }
                                        includeMouseEvents
                                        className="size-9 rounded-full !p-0"
                                        onClick={() => {
                                          if (connectedToRoom) {
                                            socket.volatile.emit("leaveRoom", {
                                              roomCode: roomConfig.code,
                                              userID,
                                              playerWasKicked: false,
                                            });
                                          }

                                          push(`/join/${friend.roomCode}`);

                                          socket.volatile.emit(
                                            "modifyFriendData",
                                            {
                                              action: "joinRoom",
                                              initiatorID: userID,
                                              roomCode: friend.roomCode,
                                              currentRoomIsPublic:
                                                friend.currentRoomIsPublic,
                                            },
                                          );

                                          setShowFriendsListDialog(false);
                                        }}
                                      >
                                        <TbDoorEnter size={"1.25rem"} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side={"bottom"}
                                      sideOffset={8}
                                      className="border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 text-lightGreen"
                                    >
                                      <p>Join room</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <Popover
                                  open={openPopoverID === friend.userId}
                                  onOpenChange={(open) => {
                                    if (!open) setOpenPopoverID("");
                                  }}
                                >
                                  <PopoverTrigger>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant={"destructive"}
                                            includeMouseEvents
                                            className="baseFlex size-9 rounded-full !p-0"
                                            onClick={() =>
                                              setOpenPopoverID(friend.userId)
                                            }
                                          >
                                            <FaTrashAlt size={"1.23rem"} />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side={"bottom"}
                                          sideOffset={8}
                                          align={"end"}
                                          className="border-2 border-[hsl(0,84%,60%)] bg-[hsl(0,84%,98%)] text-[hsl(0,84%,40%)]"
                                        >
                                          <p>Remove friend</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    redArrow
                                    align={"end"}
                                    className="text-[hsl(0,84%,40%) border-2 border-[hsl(0,84%,60%)] bg-[hsl(0,84%,98%)]"
                                  >
                                    <div className="baseVertFlex w-64 gap-3 p-2">
                                      <p className="text-center font-semibold text-[hsl(0,84%,40%)]">
                                        Are you sure you want to remove &ldquo;
                                        {friend.username}
                                        &rdquo; as a friend?
                                      </p>
                                      <Button
                                        variant={"destructive"}
                                        onClick={() => {
                                          setOpenPopoverID("");

                                          setTimeout(() => {
                                            socket.volatile.emit(
                                              "modifyFriendData",
                                              {
                                                action: "removeFriend",
                                                initiatorID: userID,
                                                targetID: friend.userId,
                                              },
                                            );
                                          }, 350);
                                        }}
                                      >
                                        Confirm
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                  </>
                </motion.div>
              ) : (
                <motion.div
                  key={"pendingListContent"}
                  initial={{ opacity: 0, x: "20%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "20%" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="baseVertFlex min-h-72 w-full !items-start !justify-start gap-4 overflow-auto p-2"
                >
                  <>
                    {
                      // no friend invites or room invites
                      friendInviteIDs?.length === 0 &&
                        roomInviteIDs?.length === 0 && (
                          <div className="baseVertFlex h-72 w-full gap-4 text-lightGreen">
                            <FaMagnifyingGlass className="size-6" />
                            No pending invites.
                          </div>
                        )
                    }

                    {friendInviteIDs && friendInviteIDs.length > 0 && (
                      <div
                        style={{
                          padding: friendInviteIDs.length > 0 ? "0.5rem" : "0",
                        }}
                        className="flex w-full items-start justify-start gap-4 overflow-auto"
                      >
                        {friendInviteIDs.map((friend, index) => (
                          <div
                            key={friend.userId}
                            style={{
                              zIndex: friendInviteIDs.length - index,
                            }}
                            className="baseFlex gap-6 text-lightGreen"
                          >
                            <div className="baseFlex gap-4">
                              <PlayerIcon
                                avatarPath={friend.avatarPath}
                                borderColor={friend.color}
                                size={"2.75rem"}
                              />
                              <div className="baseVertFlex !items-start leading-5">
                                {friend.username}
                                <div className="text-sm opacity-70">
                                  Friend invite
                                </div>
                              </div>
                            </div>
                            <div className="baseFlex gap-[0.75rem]">
                              <Button
                                variant={"secondary"}
                                className="size-8 rounded-full !p-0"
                                onClick={() =>
                                  socket.volatile.emit("modifyFriendData", {
                                    action: "acceptFriendInvite",
                                    initiatorID: userID,
                                    targetID: friend.userId,
                                  })
                                }
                              >
                                <AiOutlineCheck size={"1rem"} />
                              </Button>

                              <Button
                                variant={"destructive"}
                                className="size-8 rounded-full !p-0"
                                onClick={() => {
                                  socket.volatile.emit("modifyFriendData", {
                                    action: "declineFriendInvite",
                                    initiatorID: userID,
                                    targetID: friend.userId,
                                  });
                                }}
                              >
                                <AiOutlineClose size={"1rem"} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* gating render until friendIDs appear so that it doesn't show loading circle
                   and the roomInvites at the same time */}
                    {friendInviteIDs &&
                      roomInviteIDs &&
                      roomInviteIDs.length > 0 &&
                      roomInviteIDs.map((friend, index) => (
                        <div
                          key={friend.userId}
                          style={{
                            zIndex: roomInviteIDs.length - index,
                          }}
                          className="baseFlex gap-6 text-lightGreen"
                        >
                          <div className="baseFlex gap-2 pl-2">
                            <TbDoorEnter size={"2rem"} />
                            <div className="baseVertFlex !items-start leading-5">
                              {friend.username}
                              <div className="text-sm opacity-70">
                                Room invite
                              </div>
                            </div>
                          </div>
                          <div className="baseFlex gap-[0.75rem]">
                            <Button
                              variant={"secondary"}
                              className="size-8 rounded-full !p-0"
                              onClick={() => {
                                // there are probably major redundancies here, but should work for now

                                const roomCodeOfRoomBeingJoined =
                                  friend.roomCode;

                                // if player has invite(s) to this room, remove them
                                for (const friend of roomInviteIDs) {
                                  if (
                                    friend.roomCode ===
                                    roomCodeOfRoomBeingJoined
                                  ) {
                                    socket.volatile.emit("modifyFriendData", {
                                      action: "acceptRoomInvite",
                                      initiatorID: userID,
                                      targetID: friend.userId,
                                      roomCode: friend.roomCode,
                                      currentRoomIsPublic:
                                        friend.currentRoomIsPublic,
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
                                  currentRoomIsPublic:
                                    friend.currentRoomIsPublic,
                                });

                                setShowFriendsListDialog(false);
                              }}
                            >
                              <AiOutlineCheck size={"1rem"} />
                            </Button>

                            <Button
                              variant={"destructive"}
                              className="size-8 rounded-full !p-0"
                              onClick={() =>
                                socket.volatile.emit("modifyFriendData", {
                                  action: "declineRoomInvite",
                                  initiatorID: userID,
                                  targetID: friend.userId,
                                })
                              }
                            >
                              <AiOutlineClose size={"1rem"} />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default FriendsList;
