import { useState, useEffect, useRef } from "react";
import { socket } from "~/pages/_app";
import { api } from "~/utils/api";
import { FiMail } from "react-icons/fi";
import { FaUserFriends } from "react-icons/fa";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { motion } from "framer-motion";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";
import { TbDoorEnter } from "react-icons/tb";
import useOnClickOutside from "../../hooks/useOnClickOutside";
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

const customButtonStyles = {
  height: "2rem",
  width: "2rem",
  padding: "1rem",
  borderRadius: "50%",
};

interface IFriendsList {
  setShowFriendsListModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function FriendsList({ setShowFriendsListModal }: IFriendsList) {
  const userID = useUserIDContext();
  const { push } = useRouter();

  const {
    playerMetadata,
    connectedToRoom,
    friendData,
    newInviteNotification,
    setNewInviteNotification,
    roomConfig,
    setConnectedToRoom,
  } = useRoomContext();

  // TODO: fix ergonomics around these queries. Currently can't fully disable
  // queries based on friendData being undefined, since jsx below will infinitely
  // render loading spinners

  const { data: friends } = api.users.getUsersFromIDList.useQuery(
    friendData?.friendIDs ?? [],
    // {
    //   enabled: Boolean(
    //     (friendData?.friendIDs ? friendData.friendIDs.length : 0) > 0,
    //   ),
    // },
  );
  const { data: friendInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.friendInviteIDs ?? [],
    // {
    //   enabled: Boolean(
    //     (friendData?.friendInviteIDs ? friendData.friendInviteIDs.length : 0) >
    //       0,
    //   ),
    // },
  );
  const { data: roomInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.roomInviteIDs ?? [],
    // {
    //   enabled: Boolean(
    //     (friendData?.roomInviteIDs ? friendData.roomInviteIDs.length : 0) > 0,
    //   ),
    // },
  );

  const [openPopoverID, setOpenPopoverID] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // clears red notification dot if it exists
    if (newInviteNotification) {
      setNewInviteNotification(false);
    }
  }, [newInviteNotification, setNewInviteNotification]);

  useOnClickOutside({
    ref: modalRef,
    setShowModal: setShowFriendsListModal,
  });

  return (
    <motion.div
      key={"friendsListModal"}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      ref={modalRef}
      className="baseVertFlex absolute right-0 top-16 w-[370px] !items-start gap-2 rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 p-4"
    >
      <div className="baseVertFlex max-h-48 w-full !items-start gap-2">
        <div className="baseFlex mb-4 gap-2 border-b-2 border-white text-xl text-lightGreen">
          <FiMail size={"1.5rem"} />
          <div className="baseFlex gap-2">
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
          </div>
        </div>
        {friendInviteIDs ? (
          <div
            style={{
              padding: friendInviteIDs.length > 0 ? "0.5rem" : "0",
            }}
            className="flex w-full items-start justify-start gap-4 overflow-auto"
          >
            {friendInviteIDs.map((friend, index) => (
              <div
                key={friend.id}
                style={{
                  zIndex: friendInviteIDs.length - index,
                }}
                className="baseFlex gap-4 text-lightGreen"
              >
                <div className="baseFlex gap-2">
                  <PlayerIcon
                    avatarPath={friend.avatarPath}
                    borderColor={friend.color}
                    size={"3rem"}
                  />
                  <div className="baseVertFlex !items-start">
                    {friend.username}
                    <div className="text-sm opacity-80">friend invite</div>
                  </div>
                </div>
                <div className="baseFlex gap-[0.75rem]">
                  <Button
                    variant={"secondary"}
                    style={customButtonStyles}
                    onClick={() =>
                      socket.emit("modifyFriendData", {
                        action: "acceptFriendInvite",
                        initiatorID: userID,
                        targetID: friend.id,
                      })
                    }
                  >
                    <AiOutlineCheck size={"1.5rem"} />
                  </Button>

                  <Button
                    variant={"destructive"}
                    style={customButtonStyles}
                    onClick={() => {
                      socket.emit("modifyFriendData", {
                        action: "declineFriendInvite",
                        initiatorID: userID,
                        targetID: friend.id,
                      });
                    }}
                  >
                    <AiOutlineClose size={"1.5rem"} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="baseFlex w-full">
            <div
              className="inline-block size-10 animate-spin rounded-full border-[2px] border-lightGreen border-t-transparent text-lightGreen"
              role="status"
              aria-label="loading"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}

        {/* gating render until friendIDs appear so that it doesn't show loading circle
            and the roomInvites at the same time */}
        {friendInviteIDs &&
          roomInviteIDs &&
          roomInviteIDs.map((friend, index) => (
            <div
              key={friend.id}
              style={{
                zIndex: roomInviteIDs.length - index,
              }}
              className="baseFlex gap-4 p-2 text-lightGreen"
            >
              <div className="baseFlex gap-2 pl-2">
                <TbDoorEnter size={"2rem"} />
                <div className="baseVertFlex !items-start">
                  {friend.username}
                  <div className="text-sm opacity-80">room invite</div>
                </div>
              </div>
              <div className="baseFlex gap-[0.75rem]">
                <Button
                  variant={"secondary"}
                  style={customButtonStyles}
                  onClick={() => {
                    // there are probably major redundancies here, but should work for now

                    const roomCodeOfRoomBeingJoined = friend.roomCode;

                    // if player has invite(s) to this room, remove them
                    for (const friend of roomInviteIDs) {
                      if (friend.roomCode === roomCodeOfRoomBeingJoined) {
                        socket.emit("modifyFriendData", {
                          action: "acceptRoomInvite",
                          initiatorID: userID,
                          targetID: friend.id,
                          roomCode: friend.roomCode,
                          currentRoomIsPublic: friend.currentRoomIsPublic,
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
                      currentRoomIsPublic: friend.currentRoomIsPublic,
                    });

                    socket.emit("joinRoom", {
                      userID,
                      code: friend.roomCode,
                      playerMetadata: playerMetadata[userID],
                    });

                    setConnectedToRoom(true);
                  }}
                >
                  <AiOutlineCheck size={"1.5rem"} />
                </Button>

                <Button
                  variant={"destructive"}
                  style={customButtonStyles}
                  onClick={() =>
                    socket.emit("modifyFriendData", {
                      action: "declineRoomInvite",
                      initiatorID: userID,
                      targetID: friend.id,
                    })
                  }
                >
                  <AiOutlineClose size={"1.5rem"} />
                </Button>
              </div>
            </div>
          ))}
      </div>

      <div className="baseVertFlex max-h-96 w-full !items-start gap-2">
        <div className="baseFlex mt-4 gap-2 border-b-2 border-white text-xl text-lightGreen">
          <FaUserFriends size={"1.5rem"} />
          <div className="baseFlex gap-2 text-lightGreen">
            Friends
            {friends !== undefined && (
              <div className="baseFlex gap-[0.1rem]">
                <div>(</div>
                <div>{friends.length}</div>
                <div>)</div>
              </div>
            )}
          </div>
        </div>
        {friends ? (
          // extra padding bottom so that scrollbar doesn't show unless needed
          <div
            // style={{
            //   paddingBottom:
            //     showingDeleteFriendConfirmationModal && friends.length > 0
            //       ? "7rem"
            //       : "3rem",
            // }}
            className="flex w-full flex-col items-start justify-start gap-4 overflow-auto p-2"
          >
            {friends
              .sort(
                ({ online: onlineA = false }, { online: onlineB = false }) =>
                  Number(onlineB) - Number(onlineA),
              )
              .map((friend, index) => (
                <div
                  key={friend.id}
                  style={{
                    zIndex: friends.length - index,
                  }}
                  className="baseFlex gap-2 transition-all"
                >
                  <div className="baseFlex gap-4">
                    <PlayerIcon
                      avatarPath={friend.avatarPath}
                      borderColor={friend.color}
                      size={"3rem"}
                      onlineStatus={friend.online}
                    />
                    <div className="baseVertFlex !items-start text-lightGreen">
                      {friend.username}
                      {friend.online && (
                        <div className="text-sm opacity-80">
                          {friend.status}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="baseFlex gap-2">
                    <Button
                      disabled={
                        !friend.online ||
                        friend.status === "in a game" ||
                        !connectedToRoom ||
                        friend.roomCode === roomConfig.code
                      }
                      style={customButtonStyles}
                      // hoverTooltipText={"Send room invite"}
                      // hoverTooltipTextPosition={"bottom"}
                      // postClickTooltipText={"Invite sent!"}
                      // hoverTooltipTextTop={"2.25rem"}
                      onClick={() =>
                        socket.emit("modifyFriendData", {
                          action: "sendRoomInvite",
                          initiatorID: userID,
                          targetID: friend.id,
                        })
                      }
                    >
                      <FiMail size={"1.5rem"} />
                    </Button>

                    <Button
                      disabled={
                        !friend.online ||
                        friend.roomCode === null ||
                        friend.roomCode === roomConfig.code ||
                        friend.status === "in a game" ||
                        !friend.currentRoomIsPublic ||
                        friend.currentRoomIsFull === true
                      }
                      // hoverTooltipText={"Join room"}
                      // hoverTooltipTextPosition={"bottom"}
                      // hoverTooltipTextTop={"2.25rem"}
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
                          currentRoomIsPublic: friend.currentRoomIsPublic,
                        });

                        socket.emit("joinRoom", {
                          userID,
                          code: friend.roomCode,
                          playerMetadata: playerMetadata[userID],
                        });

                        setConnectedToRoom(true);
                      }}
                      style={customButtonStyles}
                    >
                      <TbDoorEnter size={"1.5rem"} />
                    </Button>

                    <Popover
                      open={openPopoverID === friend.id}
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
                                className="h-[36px] w-[36px] rounded-[50%] p-0"
                                onClick={() => setOpenPopoverID(friend.id)}
                              >
                                <FaTrashAlt size={"1.25rem"} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent
                              side={"bottom"}
                              className="border-2 border-[hsl(0,84%,60%)] bg-[hsl(0,84%,98%)] text-[hsl(0,84%,40%)]"
                            >
                              <p>Remove friend</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </PopoverTrigger>
                      <PopoverContent
                        redArrow
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
                                socket.emit("modifyFriendData", {
                                  action: "removeFriend",
                                  initiatorID: userID,
                                  targetID: friend.id,
                                });
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
          </div>
        ) : (
          <div className="baseFlex w-full">
            <div
              className="inline-block size-10 animate-spin rounded-full border-[2px] border-lightGreen border-t-transparent text-lightGreen"
              role="status"
              aria-label="loading"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default FriendsList;
