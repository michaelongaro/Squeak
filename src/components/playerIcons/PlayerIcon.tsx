import { type CSSProperties } from "react";
import { socket } from "../../pages";
import { motion } from "framer-motion";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import SecondaryButton from "../Buttons/SecondaryButton";
import DangerButton from "../Buttons/DangerButton";
import { AiOutlinePlus, AiOutlineClose } from "react-icons/ai";
interface IPlayerIcon {
  avatarPath?: string;
  borderColor?: string;
  size: string;
  username?: string;
  playerID?: string;
  showAddFriendButton?: boolean;
  showRemovePlayerFromRoomButton?: boolean;
  onlineStatus?: boolean;
  style?: CSSProperties;
}

function PlayerIcon({
  avatarPath,
  borderColor,
  size,
  username,
  showAddFriendButton,
  playerID,
  showRemovePlayerFromRoomButton,
  onlineStatus,
  style,
}: IPlayerIcon) {
  const userID = useUserIDContext();

  const { roomConfig } = useRoomContext();

  return (
    <>
      {avatarPath && borderColor ? (
        <motion.div
          key={`playerIcon${playerID}`}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.75 }}
          transition={{ duration: 0.15 }}
          style={{
            ...style,
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseVertFlex gap-2"
        >
          <div
            style={{
              outline: `4px solid ${borderColor}`,
            }}
            className="relative rounded-[50%] bg-white bg-opacity-80"
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
                    playerWasKicked: true,
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
                className="absolute bottom-0 right-[-0.25rem] h-4 w-4 rounded-[50%]"
              ></div>
            )}
          </div>
          {username ? username : null}
        </motion.div>
      ) : (
        <div className="skeletonLoading h-12 w-12 rounded-[50%]"></div>
      )}
    </>
  );
}

export default PlayerIcon;
