import React from "react";
import { socket } from "../../pages";
import SecondaryButton from "../Buttons/SecondaryButton";
import { AiOutlinePlus, AiOutlineClose } from "react-icons/ai";
import DangerButton from "../Buttons/DangerButton";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";

interface IPlayerIcon {
  avatarPath?: string;
  borderColor?: string;
  size: string;
  username?: string;
  playerID?: string;
  showAddFriendButton?: boolean;
  showRemovePlayerFromRoomButton?: boolean;
}
// TODO: probably just pass through the whole player object and allow it to be undefined,
// if so then just show loading skeleton?

function PlayerIcon({
  avatarPath,
  borderColor,
  size,
  username,
  showAddFriendButton,
  playerID,
  showRemovePlayerFromRoomButton,
}: IPlayerIcon) {
  const { roomConfig } = useRoomContext();
  const { value: userID } = useUserIDContext();

  return (
    <>
      {avatarPath && borderColor ? (
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
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
                relativeTooltipPosition="bottom"
                icon={<AiOutlineClose size={"1rem"} />}
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
          </div>
          {username ? username : null}
        </div>
      ) : (
        <div className="skeletonLoading h-12 w-12 rounded-full"></div>
      )}
    </>
  );
}

export default PlayerIcon;
