import React from "react";

interface IPlayerIcon {
  avatarPath: string;
  borderColor: string;
  size: string;
  username?: string;
}
// TODO: probably just pass through the whole player object and allow it to be undefined,
// if so then return null

// probably need to add opacity as a prop because you don't always want the bg-opacity-80 (tooltip)

function PlayerIcon({ avatarPath, borderColor, size, username }: IPlayerIcon) {
  return (
    <div className="baseVertFlex gap-2">
      <div
        style={{
          outline: `4px solid ${borderColor}`,
        }}
        className="rounded-full bg-white bg-opacity-80"
        onClick={() => console.log("child clicked")}
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
  );
}

export default PlayerIcon;
