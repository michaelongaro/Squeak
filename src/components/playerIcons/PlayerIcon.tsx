import React from "react";

interface IPlayerIcon {
  avatarPath: string;
  borderColor: string;
  size: string;
  iconOpacity?: number;
  showOutline?: boolean;
  cursorType?: string;
}

function PlayerIcon({
  avatarPath,
  borderColor,
  size,
  iconOpacity = 1,
  showOutline = true,
  cursorType = "auto",
}: IPlayerIcon) {
  return (
    <div
      style={{
        outline: showOutline ? `4px solid ${borderColor}` : "none",
        cursor: cursorType,
      }}
      className="rounded-full bg-white bg-opacity-80"
      onClick={() => console.log("child clicked")}
    >
      <img
        style={{
          width: size,
          height: size,
          opacity: iconOpacity,
        }}
        className="p-2" //h-["${size}"] w-["${size}"]
        src={avatarPath}
        alt={"Player Icon"}
        draggable="false"
      />
    </div>
  );
}

export default PlayerIcon;
