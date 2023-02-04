import React from "react";

interface IPlayerIcon {
  avatarPath?: string;
  borderColor?: string;
  size: string;
  username?: string;
}
// TODO: probably just pass through the whole player object and allow it to be undefined,
// if so then just show loading skeleton?

function PlayerIcon({ avatarPath, borderColor, size, username }: IPlayerIcon) {
  return (
    <>
      {avatarPath && borderColor ? (
        <div className="baseVertFlex gap-2">
          <div
            style={{
              outline: `4px solid ${borderColor}`,
            }}
            className="rounded-full bg-white bg-opacity-80"
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
