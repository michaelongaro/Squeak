import React from "react";
import { socket } from "../../pages";
import SecondaryButton from "../Buttons/SecondaryButton";
import { AiOutlinePlus, AiOutlineClose } from "react-icons/ai";
import DangerButton from "../Buttons/DangerButton";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { motion } from "framer-motion";
interface IPlayerIcon {
  avatarPath?: string;
  borderColor?: string;
  size: string;
  username?: string;
  playerID?: string;
  avatarToUsernamePositioning?: "left" | "right";
  showAddFriendButton?: boolean;
  showRemovePlayerFromRoomButton?: boolean;
  onlineStatus?: boolean;
}

function PlayerIcon({
  avatarPath,
  borderColor,
  size,
  username,
  avatarToUsernamePositioning,
  showAddFriendButton,
  playerID,
  showRemovePlayerFromRoomButton,
  onlineStatus,
}: IPlayerIcon) {
  const { roomConfig } = useRoomContext();
  const { value: userID } = useUserIDContext();

  return (
    <>
      {avatarPath && borderColor ? (
        <motion.div
          key={`playerIcon${playerID}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            color: "hsl(120deg 100% 86%)",
            alignItems: avatarToUsernamePositioning
              ? avatarToUsernamePositioning === "left"
                ? "flex-start"
                : "flex-end"
              : "center",
          }}
          className="baseVertFlex gap-2"
        >
          <div
            style={{
              outline: `4px solid ${borderColor}`,
            }}
            className="relative rounded-full bg-white bg-opacity-80"
          >
            <img
              style={{
                width: size,
                height: size,
              }}
              className="p-2"
              src={avatarPath}
              alt={"Player Icon"}
              draggable="false"
            />

            {showAddFriendButton && (
              <SecondaryButton
                icon={<AiOutlinePlus size={"1rem"} />}
                extraPadding={false}
                width={"30px"}
                height={"30px"}
                hoverTooltipText={"Send friend invite"}
                hoverTooltipTextPosition={"bottom"}
                postClickTooltipText={"Friend invite sent!"}
                onClickFunction={() => {
                  socket.emit("modifyFriendData", {
                    action: "sendFriendInvite",
                    initiatorID: userID,
                    targetID: playerID,
                  });
                }}
                style={{
                  position: "absolute",
                  top: "-0.75rem",
                  left: "-1rem",
                  padding: "0",
                  borderRadius: "50%",
                }}
              />
            )}

            {showRemovePlayerFromRoomButton && (
              <DangerButton
                innerText="Confirm"
                innerTooltipText="Kick player?"
                icon={<AiOutlineClose size={"1rem"} />}
                hoverTooltipText={"Kick"}
                onClickFunction={() => {
                  if (!playerID) return;
                  socket.emit("leaveRoom", {
                    playerID,
                    roomCode: roomConfig.code,
                  });
                }}
                width={"30px"}
                height={"30px"}
                style={{
                  position: "absolute",
                  top: "-0.75rem",
                  right: "-1rem",
                  padding: "0",
                  borderRadius: "50%",
                }}
              />
            )}

            {onlineStatus !== undefined && (
              <div
                style={{
                  backgroundColor: onlineStatus
                    ? "hsl(120deg 100% 35%)"
                    : "hsl(0deg 100% 40%)",
                }}
                className="absolute right-[-0.25rem] bottom-0 h-4 w-4 rounded-full"
              ></div>
            )}
          </div>
          {username ? username : null}
        </motion.div>
      ) : (
        <div className="skeletonLoading h-12 w-12 rounded-full"></div>
      )}
    </>
  );
}

export default PlayerIcon;
