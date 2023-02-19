import React from "react";
import { socket } from "../../pages";
import { FiMail } from "react-icons/fi";
import { FaUserFriends } from "react-icons/fa";
import { useRoomContext } from "../../context/RoomContext";
import { trpc } from "../../utils/trpc";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { motion } from "framer-motion";
import SecondaryButton from "../Buttons/SecondaryButton";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";
import { BiMailSend } from "react-icons/bi";
import { IoEnterOutline } from "react-icons/io5";
import { useUserIDContext } from "../../context/UserIDContext";
import DangerButton from "../Buttons/DangerButton";

const customButtonStyles = {
  height: "2rem",
  width: "2rem",
  padding: "1rem",
  borderRadius: "50%",
};

function FriendsList() {
  const {
    friendData,
    setPageToRender,
    connectedToRoom,
    setConnectedToRoom,
    roomConfig,
    playerMetadata,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const { data: friends } = trpc.users.getUsersFromIDList.useQuery(
    friendData.friendIDs
  );
  const { data: friendInviteIDs } = trpc.users.getUsersFromIDList.useQuery(
    friendData.friendInviteIDs
  );
  const { data: roomInviteIDs } = trpc.users.getUsersFromIDList.useQuery(
    friendData.roomInviteIDs
  );

  // eventually get current user data from prisma so you can't join a room you are already in
  // and other qol updates

  return (
    <motion.div
      key={"friendsListModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseVertFlex absolute right-0 top-16 w-[350px] !items-start gap-2 rounded-md border-2 border-white bg-green-800 p-4"
    >
      <div className="baseVertFlex w-full !items-start gap-2">
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseFlex mb-4 gap-2 border-b-2 border-white text-xl"
        >
          <FiMail size={"1.5rem"} />
          <div className="baseFlex gap-2 ">
            Pending
            {friendInviteIDs !== undefined && (
              <div className="baseFlex gap-[0.1rem]">
                <div>(</div>
                <div>{friendInviteIDs.length}</div>
                <div>)</div>
              </div>
            )}
          </div>
        </div>
        {friendInviteIDs ? (
          friendInviteIDs.map((friend) => (
            <div
              key={friend.id}
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="baseFlex gap-2"
            >
              <PlayerIcon
                avatarPath={friend.avatarPath}
                borderColor={friend.color}
                size={"3rem"}
              />
              <div>{friend.username}</div>
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
                // not sure why icon doesn't show (setting flex-shrink: 0; on svg fixes* it)
                style={customButtonStyles}
              />
            </div>
          ))
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
          roomInviteIDs.map((friend) => (
            <div
              key={friend.id}
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="baseFlex gap-2"
            >
              <div>{friend.username}</div>
              <SecondaryButton
                icon={<AiOutlineCheck size={"1.5rem"} />}
                extraPadding={false}
                onClickFunction={() =>
                  socket.emit("modifyFriendData", {
                    action: "acceptRoomInvite",
                    initiatorID: userID,
                    targetID: friend.id,
                    roomCode: friend.roomCode,
                    currentRoomIsPublic: friend.currentRoomIsPublic,
                  })
                }
                style={customButtonStyles}
              />
              <DangerButton
                icon={<AiOutlineClose size={"1.5rem"} />}
                onClickFunction={() =>
                  socket.emit("modifyFriendData", {
                    action: "declineRoomInvite",
                    initiatorID: userID,
                  })
                }
                style={customButtonStyles}
              />
            </div>
          ))}
      </div>

      <div className="baseVertFlex w-full !items-start gap-2">
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseFlex mb-4 mt-4 gap-2 border-b-2 border-white text-xl"
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
          friends.map((friend) => (
            <div key={friend.id} className="baseFlex gap-2">
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
                    <div className="text-sm opacity-80">{friend.status}</div>
                  )}
                </div>
              </div>
              <SecondaryButton
                icon={<BiMailSend size={"1.5rem"} />}
                extraPadding={false}
                disabled={
                  !friend.online ||
                  friend.status === "in a game" ||
                  !connectedToRoom
                }
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
                  !friend.currentRoomIsPublic
                }
                onClickFunction={() => {
                  if (connectedToRoom) {
                    socket.emit("leaveRoom", {
                      roomCode: roomConfig.code,
                      userID,
                    });
                  }

                  setPageToRender("joinRoom");

                  socket.emit("modifyFriendData", {
                    action: "joinRoom", // think about this one (run through what might go wrong interaction-wise)
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
                icon={<FaTrashAlt size={"1.5rem"} />}
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
          ))
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
