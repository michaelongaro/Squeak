import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import { FiMail } from "react-icons/fi";
import { FaUserFriends } from "react-icons/fa";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";
import { TbDoorEnter } from "react-icons/tb";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/router";
import { IoIosArrowForward } from "react-icons/io";
import { type AllViewLabels } from "~/components/TopRightControls/TopRightControls";

interface IFriendsListSheet {
  setRenderedView: React.Dispatch<
    React.SetStateAction<AllViewLabels | undefined>
  >;
}

function FriendsListSheet({ setRenderedView }: IFriendsListSheet) {
  const userID = useUserIDContext();
  const { push } = useRouter();

  const {
    connectedToRoom,
    friendData,
    newInviteNotification,
    setNewInviteNotification,
    roomConfig,
    setShowSettingsSheet,
  } = useRoomContext();

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

  const [viewState, setViewState] = useState<"friends" | "pending">("friends");

  useEffect(() => {
    // clears red notification dot if it exists
    if (newInviteNotification) {
      setNewInviteNotification(false);
    }
  }, [newInviteNotification, setNewInviteNotification]);

  return (
    <motion.div
      key={"friendsListSheet"}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="baseVertFlex h-full w-full !items-start gap-2"
    >
      <div className="absolute left-0 top-0 z-10 h-8 w-full bg-zinc-200">
        <Button
          variant={"text"}
          onClick={() => setRenderedView(undefined)}
          className="baseFlex !absolute left-2 top-0 gap-2 !p-0 text-darkGreen"
        >
          <IoIosArrowForward size={"1rem"} className="rotate-180" />
          Back
        </Button>
      </div>

      <div className="baseFlex mt-10 w-full border-y-2 border-darkGreen">
        <Button
          variant={viewState === "friends" ? "default" : "secondary"}
          onClick={() => setViewState("friends")}
          className="baseFlex w-1/2 gap-2 rounded-none border-r-2 !border-none border-white font-medium"
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
          className="baseFlex w-1/2 gap-2 rounded-none !border-none font-medium"
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

      <div className="baseVertFlex h-full w-full !items-start !justify-start gap-2 overflow-hidden">
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
              className="baseFlex h-full w-full"
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
                  initial={{ opacity: 0, x: "-15%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "-15%" }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="baseVertFlex min-h-full w-full !items-start !justify-start gap-4 overflow-auto p-2"
                >
                  <>
                    {friends.length === 0 ? (
                      <div className="baseVertFlex h-full w-full gap-4 text-darkGreen">
                        <FaMagnifyingGlass className="size-6" />
                        You don&apos;t have any friends yet.
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
                              className="baseVertFlex w-full !items-start gap-4 transition-all"
                            >
                              <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                              >
                                <AccordionItem
                                  value="item-1"
                                  className="border-darkGreen text-darkGreen"
                                >
                                  <AccordionTrigger>
                                    <Button
                                      variant={"sheet"}
                                      className="baseFlex mb-1 !w-full !justify-start gap-2 !rounded-md border-darkGreen !py-8"
                                    >
                                      <div className="baseFlex gap-4">
                                        <PlayerIcon
                                          avatarPath={friend.avatarPath}
                                          borderColor={friend.color}
                                          size={"2.75rem"}
                                          onlineStatus={friend.online}
                                        />
                                        <div className="baseVertFlex !items-start text-darkGreen">
                                          {friend.username}
                                          <div className="text-sm opacity-70">
                                            {friend.status}
                                          </div>
                                        </div>
                                      </div>
                                    </Button>
                                  </AccordionTrigger>
                                  <AccordionContent className="baseFlex my-4 w-full">
                                    <div className={`baseFlex w-full gap-4`}>
                                      <Button
                                        variant={"secondary"}
                                        disabled={
                                          !friend.online ||
                                          friend.status === "in a game" ||
                                          !connectedToRoom ||
                                          friend.roomCode === roomConfig.code
                                        }
                                        className="baseFlex gap-2 !px-2 text-sm"
                                        onClick={() =>
                                          socket.emit("modifyFriendData", {
                                            action: "sendRoomInvite",
                                            initiatorID: userID,
                                            targetID: friend.userId,
                                          })
                                        }
                                      >
                                        <FiMail size={"1.25rem"} />
                                        Invite to room
                                      </Button>

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
                                        className="baseFlex gap-2 !px-2 text-sm"
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
                                            currentRoomIsPublic:
                                              friend.currentRoomIsPublic,
                                          });

                                          setShowSettingsSheet(false);
                                        }}
                                      >
                                        <TbDoorEnter size={"1.25rem"} />
                                        <p>Join room</p>
                                      </Button>

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="destructive"
                                            className="gap-2"
                                          >
                                            <FaTrashAlt size={"1rem"} />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader className="baseFlex w-full">
                                            <AlertDialogTitle className="w-72">
                                              Are you sure you want to remove
                                              &ldquo;
                                              {friend.username}
                                              &rdquo; as a friend?
                                            </AlertDialogTitle>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter className="baseFlex mt-4 !flex-row gap-8">
                                            <AlertDialogCancel asChild>
                                              <Button
                                                variant={"secondary"}
                                                className="m-0 w-24"
                                              >
                                                Cancel
                                              </Button>
                                            </AlertDialogCancel>
                                            <AlertDialogAction asChild>
                                              <Button
                                                variant={"destructive"}
                                                className="m-0 w-24"
                                                onClick={() => {
                                                  setTimeout(() => {
                                                    socket.emit(
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
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          ))}
                      </>
                    )}
                  </>
                </motion.div>
              ) : (
                <motion.div
                  key={"pendingListContent"}
                  initial={{ opacity: 0, x: "15%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "15%" }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="baseVertFlex min-h-full w-full !items-start !justify-start gap-4 overflow-auto p-2"
                >
                  <>
                    {
                      // no friend invites or room invites
                      friendInviteIDs?.length === 0 &&
                        roomInviteIDs?.length === 0 && (
                          <div className="baseVertFlex h-full w-full gap-4 text-darkGreen">
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
                            className="baseFlex gap-6 text-darkGreen"
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
                                  socket.emit("modifyFriendData", {
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
                                  socket.emit("modifyFriendData", {
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
                          className="baseFlex gap-6 text-darkGreen"
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
                                    socket.emit("modifyFriendData", {
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
                                  currentRoomIsPublic:
                                    friend.currentRoomIsPublic,
                                });

                                setShowSettingsSheet(false);
                              }}
                            >
                              <AiOutlineCheck size={"1rem"} />
                            </Button>

                            <Button
                              variant={"destructive"}
                              className="size-8 rounded-full !p-0"
                              onClick={() =>
                                socket.emit("modifyFriendData", {
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

export default FriendsListSheet;
