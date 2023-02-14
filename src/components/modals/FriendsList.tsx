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
import { useUserIDContext } from "../../context/UserIDContext";
import DangerButton from "../Buttons/DangerButton";

function FriendsList() {
  const { friendData } = useRoomContext();
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

  return (
    <motion.div
      key={"friendsListModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseVertFlex absolute right-0 top-4 w-[400px] !items-start gap-2 rounded-md border-2 border-white bg-green-800 p-4"
    >
      <div className="baseVertFlex !items-start gap-2">
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseFlex mb-4 gap-2 border-b-2 border-white text-xl"
        >
          <FiMail size={"1.5rem"} />
          <div className="text-green-300">Pending</div>
        </div>
        {friendInviteIDs?.map((friend) => (
          <div key={friend.id} className="baseFlex gap-2">
            <PlayerIcon
              avatarPath={friend.avatarPath}
              borderColor={friend.color}
              size={"3rem"}
            />
            <div className="text-green-300">{friend.username}</div>
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
              style={{
                height: "3rem",
                width: "3rem",
                padding: "0",
                borderRadius: "50%",
              }}
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
              style={{
                height: "3rem",
                width: "3rem",
                padding: "0",
                borderRadius: "50%",
              }}
            />
          </div>
        ))}

        {roomInviteIDs?.map((friend) => (
          <div key={friend.id} className="baseFlex gap-2">
            <div className="text-green-300">{friend.username}</div>
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
              style={{
                height: "3rem",
                width: "3rem",
                padding: "0",
                borderRadius: "50%",
              }}
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
              style={{
                height: "3rem",
                width: "3rem",
                padding: "0",
                borderRadius: "50%",
              }}
            />
          </div>
        ))}
      </div>

      <div className="baseVertFlex !items-start gap-2">
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseFlex mb-4 mt-4 gap-2 border-b-2 border-white text-xl"
        >
          <FaUserFriends size={"1.5rem"} />
          <div className="text-green-300">Friends</div>
        </div>
        {friends?.map((friend) => (
          <div key={friend.id} className="baseFlex gap-2">
            <PlayerIcon
              avatarPath={friend.avatarPath}
              borderColor={friend.color}
              size={"3rem"}
            />
            <div className="text-green-300">{friend.username}</div>
            <div className="text-green-300">Invite</div>
            <div className="text-green-300">Join</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default FriendsList;
