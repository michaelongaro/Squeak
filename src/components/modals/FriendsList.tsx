import { useState, useEffect, useRef } from "react";
import { socket } from "../../pages";
import { trpc } from "../../utils/trpc";
import { FiMail } from "react-icons/fi";
import { FaUserFriends } from "react-icons/fa";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { motion } from "framer-motion";
import SecondaryButton from "../Buttons/SecondaryButton";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";
import { BiMailSend } from "react-icons/bi";
import { IoEnterOutline } from "react-icons/io5";
import DangerButton from "../Buttons/DangerButton";
import { ImEnter } from "react-icons/im";
import useOnClickOutside from "../../hooks/useOnClickOutside";

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

  const {
    playerMetadata,
    connectedToRoom,
    friendData,
    newInviteNotification,
    setNewInviteNotification,
    roomConfig,
    setPageToRender,
    setConnectedToRoom,
  } = useRoomContext();

  const { data: friends } = trpc.users.getUsersFromIDList.useQuery(
    friendData?.friendIDs ?? []
  );
  const { data: friendInviteIDs } = trpc.users.getUsersFromIDList.useQuery(
    friendData?.friendInviteIDs ?? []
  );
  const { data: roomInviteIDs } = trpc.users.getUsersFromIDList.useQuery(
    friendData?.roomInviteIDs ?? []
  );

  const [
    showingDeleteFriendConfirmationModal,
    setShowingDeleteFriendConfirmationModal,
  ] = useState<boolean>(false);

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
      className="baseVertFlex absolute right-0 top-16 w-[370px] !items-start gap-2 rounded-md border-2 border-white bg-green-800 p-4"
    >
      <div className="baseVertFlex max-h-48 w-full !items-start gap-2">
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseFlex mb-4 gap-2 border-b-2 border-white text-xl"
        >
          <FiMail size={"1.5rem"} />
          <div className="baseFlex gap-2 ">
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
                  color: "hsl(120deg 100% 86%)",
                  zIndex: friendInviteIDs.length - index,
                }}
                className="baseFlex gap-4"
              >
                <div className="baseFlex gap-2">
                  <PlayerIcon
                    avatarPath={friend.avatarPath}
                    borderColor={friend.color}
                    size={"3rem"}
                  />
                  <div className="baseVertFlex !items-start ">
                    {friend.username}
                    <div className="text-sm opacity-80">friend invite</div>
                  </div>
                </div>
                <div className="baseFlex gap-[0.75rem]">
                  <SecondaryButton
                    icon={<AiOutlineCheck size={"1.5rem"} />}
                    extraPadding={false}
                    onClickFunction={() =>
                      socket.emit("modifyFriendData", {
                        action: "acceptFriendInvite",
                        initiatorID: userID,
                        targetID: friend.id,
                      })
                    }
                    style={customButtonStyles}
                  />
                  <DangerButton
                    icon={<AiOutlineClose size={"1.5rem"} />}
                    onClickFunction={() =>
                      socket.emit("modifyFriendData", {
                        action: "declineFriendInvite",
                        initiatorID: userID,
                        targetID: friend.id,
                      })
                    }
                    style={customButtonStyles}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="baseFlex w-full">
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderTop: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                borderRight: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                borderBottom: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                borderLeft: `0.35rem solid hsl(120deg 100% 86%)`,
              }}
              className="loadingSpinner"
            ></div>
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
                color: "hsl(120deg 100% 86%)",
                zIndex: roomInviteIDs.length - index,
              }}
              className="baseFlex gap-4"
            >
              <div className="baseFlex gap-2">
                <ImEnter size={"2rem"} />
                <div className="baseVertFlex !items-start ">
                  {friend.username}
                  <div className="text-sm opacity-80">room invite</div>
                </div>
              </div>
              <div className="baseFlex gap-[0.75rem]">
                <SecondaryButton
                  icon={<AiOutlineCheck size={"1.5rem"} />}
                  extraPadding={false}
                  onClickFunction={() => {
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

                    setPageToRender("joinRoom");

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
                />
                <DangerButton
                  icon={<AiOutlineClose size={"1.5rem"} />}
                  onClickFunction={() =>
                    socket.emit("modifyFriendData", {
                      action: "declineRoomInvite",
                      initiatorID: userID,
                      targetID: friend.id,
                    })
                  }
                  style={customButtonStyles}
                />
              </div>
            </div>
          ))}
      </div>

      <div className="baseVertFlex max-h-96 w-full !items-start gap-2">
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseFlex mt-4 gap-2 border-b-2 border-white text-xl"
        >
          <FaUserFriends size={"1.5rem"} />
          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseFlex gap-2 "
          >
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
            style={{
              paddingBottom:
                showingDeleteFriendConfirmationModal && friends.length > 0
                  ? "7rem"
                  : "3rem",
            }}
            className="flex w-full flex-col items-start justify-start gap-4 overflow-auto p-2  "
          >
            {friends
              .sort(
                ({ online: onlineA = false }, { online: onlineB = false }) =>
                  Number(onlineB) - Number(onlineA)
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
                    <div
                      style={{
                        color: "hsl(120deg 100% 86%)",
                      }}
                      className="baseVertFlex !items-start"
                    >
                      {friend.username}
                      {friend.online && (
                        <div className="text-sm opacity-80">
                          {friend.status}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="baseFlex gap-2">
                    <SecondaryButton
                      icon={<BiMailSend size={"1.5rem"} />}
                      extraPadding={false}
                      disabled={
                        !friend.online ||
                        friend.status === "in a game" ||
                        !connectedToRoom ||
                        friend.roomCode === roomConfig.code
                      }
                      hoverTooltipText={"Send room invite"}
                      hoverTooltipTextPosition={"bottom"}
                      postClickTooltipText={"Invite sent!"}
                      hoverTooltipTextTop={"2.25rem"}
                      onClickFunction={() =>
                        socket.emit("modifyFriendData", {
                          action: "sendRoomInvite",
                          initiatorID: userID,
                          targetID: friend.id,
                        })
                      }
                      style={customButtonStyles}
                    />
                    <SecondaryButton
                      icon={<IoEnterOutline size={"1.5rem"} />}
                      extraPadding={false}
                      disabled={
                        !friend.online ||
                        friend.roomCode === null ||
                        friend.roomCode === roomConfig.code ||
                        friend.status === "in a game" ||
                        !friend.currentRoomIsPublic ||
                        friend.currentRoomIsFull === true
                      }
                      hoverTooltipText={"Join room"}
                      hoverTooltipTextPosition={"bottom"}
                      hoverTooltipTextTop={"2.25rem"}
                      onClickFunction={() => {
                        if (connectedToRoom) {
                          socket.emit("leaveRoom", {
                            roomCode: roomConfig.code,
                            userID,
                            playerWasKicked: false,
                          });
                        }

                        setPageToRender("joinRoom");

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
                    />

                    <DangerButton
                      icon={<FaTrashAlt size={"1.25rem"} />}
                      innerText="Confirm"
                      innerTooltipText="Remove friend?"
                      hoverTooltipText="Remove friend"
                      forFriendsList={true}
                      setShowingDeleteFriendConfirmationModal={
                        setShowingDeleteFriendConfirmationModal
                      }
                      onClickFunction={() =>
                        socket.emit("modifyFriendData", {
                          action: "removeFriend",
                          initiatorID: userID,
                          targetID: friend.id,
                        })
                      }
                      style={customButtonStyles}
                    />
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="baseFlex w-full">
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderTop: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                borderRight: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                borderBottom: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                borderLeft: `0.35rem solid hsl(120deg 100% 86%)`,
              }}
              className="loadingSpinner"
            ></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default FriendsList;
