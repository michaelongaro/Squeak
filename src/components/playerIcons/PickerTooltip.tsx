import { useEffect, useRef, useState } from "react";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import { socket } from "../../pages";
import Card from "../Play/Card";
import PlayerIcon from "./PlayerIcon";

import { avatarPaths } from "../../utils/avatarPaths";
import { deckHueRotations } from "../../utils/deckHueRotations";
import { hslToDeckHueRotations } from "../../utils/hslToDeckHueRotations";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
  type IUpdatePlayerMetadata,
} from "../../pages/api/socket";
import useOnClickOutside from "../../hooks/useOnClickOutside";

import classes from "./PickerTooltip.module.css";

interface IPickerTooltip {
  type: "avatar" | "color";
  localPlayerMetadata?: IRoomPlayersMetadata;
  setLocalPlayerMetadata?: React.Dispatch<
    React.SetStateAction<IRoomPlayersMetadata>
  >;
  openAbove?: boolean;
}

function PickerTooltip({
  type,
  localPlayerMetadata,
  setLocalPlayerMetadata,
  openAbove = false,
}: IPickerTooltip) {
  const {
    playerMetadata: ctxPlayerMetadata,
    connectedToRoom: ctxConnectedToRoom,
    roomConfig,
    setPlayerMetadata: ctxSetPlayerMetadata,
  } = useRoomContext();

  // dynamic values depending on if parent is being used in <Settings /> or not
  const playerMetadata = localPlayerMetadata || ctxPlayerMetadata;
  const setPlayerMetadata = setLocalPlayerMetadata || ctxSetPlayerMetadata;
  const connectedToRoom = localPlayerMetadata ? false : ctxConnectedToRoom;

  const { value: userID } = useUserIDContext();

  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<
    ["avatar" | "color", number] | null
  >(null);

  const [userAvatarIndex, setUserAvatarIndex] = useState<number>(-1);
  const [userDeckIndex, setUserDeckIndex] = useState<number>(-1);

  const [relativeOffset, setRelativeOffset] = useState<{
    left: string;
    top: string | undefined;
    bottom: string | undefined;
  }>({ left: "0px", top: "0px", bottom: "0px" });

  const tooltipRef = useRef<HTMLDivElement>(null);

  useOnClickOutside({ ref: tooltipRef, setShowModal: setShowTooltip });

  useEffect(() => {
    const userMetadata = playerMetadata[userID];

    if (!userMetadata) return;

    const deckIndex = deckHueRotations.findIndex(
      (hueRotation) => hueRotation === userMetadata.deckHueRotation
    );

    const avatarIndex = avatarPaths.findIndex(
      (avatarPath) => avatarPath === userMetadata.avatarPath
    );

    setUserAvatarIndex(avatarIndex);
    setUserDeckIndex(deckIndex);
  }, [playerMetadata, userID]);

  useEffect(() => {
    let left = "0px";
    let top = undefined;
    let bottom = undefined;

    if (type === "avatar") {
      left = "-137px";

      if (openAbove) {
        top = "-340px";
      } else {
        bottom = "-340px";
      }
    } else {
      left = "-177px";
      if (openAbove) {
        top = "-300px";
      } else {
        bottom = "-300px";
      }
    }

    setRelativeOffset({ left, top, bottom });
  }, [type, openAbove]);

  function isTooltipOptionAvailable(
    type: "avatar" | "color",
    index: number
  ): boolean {
    if (type === "avatar") {
      return (
        index !== userAvatarIndex &&
        Object.values(playerMetadata).every(
          (metadata) => metadata.avatarPath !== avatarPaths[index]
        )
      );
    }

    return (
      index !== userDeckIndex &&
      Object.values(playerMetadata).every(
        (metadata) => metadata.deckHueRotation !== deckHueRotations[index]
      )
    );
  }

  function calculateOutline(type: "avatar" | "color", index: number): string {
    if (
      (type === "avatar" && userAvatarIndex === index) ||
      (type === "color" && userDeckIndex === index)
    )
      return "4px solid green"; // prob need to adj these colors

    if (!isTooltipOptionAvailable(type, index)) return "none";

    return hoveredTooltip &&
      hoveredTooltip[0] === type &&
      hoveredTooltip[1] === index
      ? "4px solid lightgreen" // prob need to adj these colors
      : "none";
  }

  function getMetadataOfPlayerByAttribute(
    attribute: string,
    type: "avatar" | "color"
  ): string {
    if (type === "avatar") {
      const playersMetadata = Object.values(playerMetadata);

      const playerWithAttribute = playersMetadata.find(
        (metadata) => metadata.avatarPath === attribute
      );

      if (!playerWithAttribute) return "";

      return playerWithAttribute.color;
    } else {
      const playersMetadata = Object.values(playerMetadata);

      const playerWithAttribute = playersMetadata.find(
        (metadata) => metadata.color === attribute
      );

      if (!playerWithAttribute) return "";

      return playerWithAttribute.avatarPath;
    }
  }

  return (
    <>
      {userID && (
        <div className="relative">
          {/* picker tooltip */}
          <div
            ref={tooltipRef}
            style={{
              left: relativeOffset.left,
              top: relativeOffset.top,
              bottom: relativeOffset.bottom,
              height: type === "avatar" ? "20rem" : "18rem",
              width: type === "avatar" ? "20rem" : "25rem",
              opacity: showTooltip ? 1 : 0,
              pointerEvents: showTooltip ? "auto" : "none",
              gridTemplateColumns:
                type === "avatar" ? "1fr 1fr 1fr" : "1fr 1fr 1fr 1fr",
              gridTemplateRows: type === "avatar" ? "1fr 1fr 1fr" : "1fr 1fr",
            }}
            className={`${
              openAbove ? classes.toolTipAbove : classes.toolTipBelow
            } grid place-items-center gap-4 rounded-md bg-white p-4 shadow-lg transition-all`}
          >
            {type === "avatar"
              ? avatarPaths.map((avatarPath, index) => (
                  <div
                    key={`${avatarPath}-${index}`}
                    style={{
                      outline: calculateOutline("avatar", index),
                      cursor:
                        showTooltip && isTooltipOptionAvailable("avatar", index)
                          ? "pointer"
                          : "auto",
                      pointerEvents:
                        showTooltip && isTooltipOptionAvailable("avatar", index)
                          ? "auto"
                          : "none",
                    }}
                    className="relative rounded-full outline-offset-4 transition-all"
                    onMouseEnter={() => setHoveredTooltip(["avatar", index])}
                    onMouseLeave={() => setHoveredTooltip(null)}
                    onClick={() => {
                      // if user is connected to room
                      if (connectedToRoom) {
                        socket.emit("updatePlayerMetadata", {
                          newPlayerMetadata: {
                            ...playerMetadata[userID],
                            avatarPath,
                          },
                          playerID: userID,
                          roomCode: roomConfig.code,
                        } as IUpdatePlayerMetadata);
                      }
                      // if user is not connected to room
                      else {
                        setPlayerMetadata((prev) => ({
                          ...prev,
                          [userID]: {
                            ...prev[userID],
                            avatarPath,
                          } as IRoomPlayer,
                        }));
                      }
                    }}
                  >
                    <PlayerIcon
                      avatarPath={avatarPath}
                      borderColor={"transparent"}
                      size="4rem"
                    />
                    {getMetadataOfPlayerByAttribute(avatarPath, "avatar") !==
                      playerMetadata[userID]?.color &&
                      getMetadataOfPlayerByAttribute(avatarPath, "avatar") !==
                        "" && (
                        <div
                          style={{
                            backgroundColor: getMetadataOfPlayerByAttribute(
                              avatarPath,
                              "avatar"
                            ),
                          }}
                          className="absolute bottom-[-0.75rem] right-[-0.75rem] h-4 w-4 rounded-full"
                        ></div>
                      )}
                  </div>
                ))
              : Object.keys(hslToDeckHueRotations).map((color, index) => (
                  <div
                    key={`${color}-${index}`}
                    style={{
                      outline: calculateOutline("color", index),
                      cursor:
                        showTooltip && isTooltipOptionAvailable("color", index)
                          ? "pointer"
                          : "auto",
                      pointerEvents:
                        showTooltip && isTooltipOptionAvailable("color", index)
                          ? "auto"
                          : "none",
                    }}
                    className="relative rounded-sm outline-offset-4 transition-all"
                    onMouseEnter={() => setHoveredTooltip(["color", index])}
                    onMouseLeave={() => setHoveredTooltip(null)}
                    onClick={() => {
                      // if user is connected to room
                      if (connectedToRoom) {
                        socket.emit("updatePlayerMetadata", {
                          newPlayerMetadata: {
                            ...playerMetadata[userID],
                            deckHueRotation:
                              hslToDeckHueRotations[
                                color as keyof typeof hslToDeckHueRotations // seems hacky
                              ],
                            color,
                          },
                          playerID: userID,
                          roomCode: roomConfig.code,
                        } as IUpdatePlayerMetadata);
                      }
                      // if user is not connected to room
                      else {
                        setPlayerMetadata((prev) => ({
                          ...prev,
                          [userID]: {
                            ...prev[userID],
                            color,
                            deckHueRotation:
                              hslToDeckHueRotations[
                                color as keyof typeof hslToDeckHueRotations // seems hacky
                              ],
                          } as IRoomPlayer,
                        }));
                      }
                    }}
                  >
                    <Card
                      showCardBack={true}
                      draggable={false}
                      rotation={0}
                      width={"4rem"}
                      height={"5.5rem"}
                      hueRotation={
                        hslToDeckHueRotations[
                          color as keyof typeof hslToDeckHueRotations // seems hacky
                        ]
                      }
                    />
                    <div className="absolute bottom-[-0.75rem] right-[-0.75rem] z-[999] h-12 w-12 rounded-full">
                      {getMetadataOfPlayerByAttribute(color, "color") !==
                        playerMetadata[userID]?.avatarPath &&
                        getMetadataOfPlayerByAttribute(color, "color") !==
                          "" && (
                          <PlayerIcon
                            avatarPath={getMetadataOfPlayerByAttribute(
                              color,
                              "color"
                            )}
                            borderColor={"transparent"}
                            size="3rem"
                          />
                        )}
                    </div>
                  </div>
                ))}
          </div>

          {/* preview */}
          {playerMetadata && (
            <div
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="baseVertFlex cursor-pointer gap-2"
              onClick={() => setShowTooltip(true)}
            >
              {type === "avatar" ? (
                <PlayerIcon
                  avatarPath={
                    playerMetadata[userID]?.avatarPath || "/avatars/rabbit.svg"
                  }
                  borderColor={
                    playerMetadata[userID]?.color || "hsl(352deg, 69%, 61%)"
                  }
                  size="3rem"
                />
              ) : (
                <Card
                  draggable={false}
                  rotation={0}
                  showCardBack={true}
                  ownerID={userID}
                  width={"3rem"} // roughly correct for ratio of a card
                  height={"4rem"}
                  hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
                />
              )}
              {type === "avatar" ? <div>Avatar</div> : <div>Color</div>}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default PickerTooltip;
