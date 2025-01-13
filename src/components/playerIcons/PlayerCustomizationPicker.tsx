import { useEffect, useState } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { socket } from "~/pages/_app";
import {
  type IRoomPlayer,
  type IRoomPlayersMetadata,
  type IUpdatePlayerMetadata,
} from "../../pages/api/socket";
import { avatarPaths } from "../../utils/avatarPaths";
import { deckHueRotations } from "../../utils/deckHueRotations";
import { oklchToDeckHueRotations } from "../../utils/oklchToDeckHueRotations";
import { type ILocalPlayerSettings } from "../dialogs/SettingsAndStats/UserSettingsAndStatisticsDialog";
import PlayerIcon from "./PlayerIcon";
import { updateLocalStoragePlayerMetadata } from "~/utils/updateLocalStoragePlayerMetadata";
import StaticCard from "~/components/Play/StaticCard";
import { HiExternalLink } from "react-icons/hi";

interface IPlayerCustomizationPicker {
  type: "avatar" | "back" | "front";
  localPlayerMetadata?: IRoomPlayersMetadata;
  setLocalPlayerMetadata?: React.Dispatch<
    React.SetStateAction<IRoomPlayersMetadata>
  >;
  setLocalPlayerSettings?: React.Dispatch<
    React.SetStateAction<ILocalPlayerSettings>
  >;
  forSheet?: boolean;
}

function PlayerCustomizationPicker({
  type,
  localPlayerMetadata,
  setLocalPlayerMetadata,
  setLocalPlayerSettings,
  forSheet,
}: IPlayerCustomizationPicker) {
  const userID = useUserIDContext();

  const {
    playerMetadata: storePlayerMetadata,
    setPlayerMetadata: storeSetPlayerMetadata,
    connectedToRoom: storeConnectedToRoom,
    roomConfig,
    deckVariant,
    setDeckVariant,
  } = useRoomContext();

  // dynamic values depending on if parent is being used in <Settings /> or not
  const playerMetadata = localPlayerMetadata ?? storePlayerMetadata;
  const setPlayerMetadata = setLocalPlayerMetadata ?? storeSetPlayerMetadata;
  const connectedToRoom = localPlayerMetadata ? false : storeConnectedToRoom;

  const [hoveredTooltip, setHoveredTooltip] = useState<{
    type: "avatar" | "front" | "back";
    index: number;
  } | null>(null);

  const [scaledDownElementIndex, setScaledDownElementIndex] =
    useState<number>(-1);

  const [userAvatarIndex, setUserAvatarIndex] = useState<number>(-1);
  const [userDeckIndex, setUserDeckIndex] = useState<number>(-1);

  useEffect(() => {
    const userMetadata = playerMetadata[userID];

    if (!userMetadata) return;

    const deckIndex = deckHueRotations.findIndex(
      (hueRotation) => hueRotation === userMetadata.deckHueRotation,
    );

    const avatarIndex = avatarPaths.findIndex(
      (avatarPath) => avatarPath === userMetadata.avatarPath,
    );

    setUserAvatarIndex(avatarIndex);
    setUserDeckIndex(deckIndex);
  }, [playerMetadata, userID]);

  function isTooltipOptionAvailable(
    type: "avatar" | "front" | "back",
    index: number,
    deckVariantValue?: string,
  ): boolean {
    if (type === "avatar") {
      return (
        index !== userAvatarIndex &&
        Object.values(playerMetadata).every(
          (metadata) => metadata.avatarPath !== avatarPaths[index],
        )
      );
    } else if (type === "front") {
      return deckVariant !== deckVariantValue;
    }

    return (
      index !== userDeckIndex &&
      Object.values(playerMetadata).every(
        (metadata) => metadata.deckHueRotation !== deckHueRotations[index],
      )
    );
  }

  function calculateOutline(
    type: "avatar" | "front" | "back",
    index: number,
    deckVariantValue?: string,
  ): string {
    if (
      (type === "avatar" && userAvatarIndex === index) ||
      (type === "front" && deckVariant === deckVariantValue) ||
      (type === "back" && userDeckIndex === index)
    ) {
      return "4px solid hsl(120deg 100% 18%)";
    }

    if (!isTooltipOptionAvailable(type, index)) return "4px solid transparent";

    return hoveredTooltip &&
      hoveredTooltip.type === type &&
      hoveredTooltip.index === index
      ? "4px solid hsl(120deg 100% 40%)"
      : "4px solid transparent";
  }

  function getMetadataOfPlayerByAttribute(
    attribute: string,
    type: "avatar" | "back",
  ): string {
    if (type === "avatar") {
      const playersMetadata = Object.values(playerMetadata);

      const playerWithAttribute = playersMetadata.find(
        (metadata) => metadata.avatarPath === attribute,
      );

      if (!playerWithAttribute) return "";

      return playerWithAttribute.color;
    } else {
      const playersMetadata = Object.values(playerMetadata);

      const playerWithAttribute = playersMetadata.find(
        (metadata) => metadata.color === attribute,
      );

      if (!playerWithAttribute) return "";

      return playerWithAttribute.avatarPath;
    }
  }

  function renderAvatarTooltip() {
    return (
      <div
        className={`h-[18rem] w-[18rem] grid-cols-3 grid-rows-3 md:h-[20rem] md:w-[20rem] ${forSheet ? "bg-zinc-200" : ""} grid place-items-center rounded-md p-4 transition-all`}
      >
        {avatarPaths.map((avatarPath, index) => (
          <div
            key={`${avatarPath}-${index}`}
            style={{
              outline: calculateOutline("avatar", index),
              cursor: isTooltipOptionAvailable("avatar", index)
                ? "pointer"
                : "auto",
              pointerEvents: isTooltipOptionAvailable("avatar", index)
                ? "auto"
                : "none",
            }}
            className="relative shrink-0 rounded-[50%] outline-offset-4 transition-all"
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") {
                setHoveredTooltip({ type: "avatar", index });
              }

              setScaledDownElementIndex(index);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") {
                setHoveredTooltip(null);
              }

              setScaledDownElementIndex(-1);
            }}
            onPointerCancel={(e) => {
              if (e.pointerType === "mouse") {
                setHoveredTooltip(null);
              }

              setScaledDownElementIndex(-1);
            }}
            onPointerDown={() => {
              setScaledDownElementIndex(index);
            }}
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
                updateLocalStoragePlayerMetadata({
                  avatarPath,
                  color: playerMetadata[userID]?.color || "",
                  deckVariant,
                  deckHueRotation: playerMetadata[userID]?.deckHueRotation || 0,
                });

                setPlayerMetadata({
                  ...playerMetadata,
                  [userID]: {
                    ...playerMetadata[userID],
                    avatarPath,
                  } as IRoomPlayer,
                });
              }
            }}
          >
            <div
              className={`transition-transform ${scaledDownElementIndex === index ? "scale-95" : ""}`}
            >
              <PlayerIcon
                avatarPath={avatarPath}
                borderColor={"transparent"}
                size="4rem"
                transparentBackground
              />
            </div>
            {connectedToRoom &&
              getMetadataOfPlayerByAttribute(avatarPath, "avatar") !==
                playerMetadata[userID]?.color &&
              getMetadataOfPlayerByAttribute(avatarPath, "avatar") !== "" && (
                <div
                  style={{
                    backgroundColor: getMetadataOfPlayerByAttribute(
                      avatarPath,
                      "avatar",
                    ),
                  }}
                  className="absolute bottom-[-0.25rem] right-[-0.25rem] h-4 w-4 rounded-[50%]"
                ></div>
              )}
          </div>
        ))}
      </div>
    );
  }

  function renderCardFrontTooltip() {
    const cardFrontVariants = ["Simple", "Standard", "Antique"];

    return (
      <div className="baseVertFlex gap-2 text-black">
        <div
          className={`h-[10rem] w-[22rem] grid-cols-3 grid-rows-1 ${forSheet ? "mt-2 bg-zinc-200" : ""} grid place-items-center rounded-md p-4 transition-all`}
        >
          {cardFrontVariants.map((variant, index) => (
            <div key={variant} className="baseVertFlex gap-3.5">
              <div
                style={{
                  outline: calculateOutline("front", index, variant),
                  cursor: deckVariant !== variant ? "pointer" : "auto",
                  pointerEvents: deckVariant !== variant ? "auto" : "none",
                }}
                className="relative shrink-0 rounded-sm outline-offset-4 transition-all"
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") {
                    setHoveredTooltip({ type: "front", index });
                  }

                  setScaledDownElementIndex(index);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") {
                    setHoveredTooltip(null);
                  }

                  setScaledDownElementIndex(-1);
                }}
                onPointerCancel={(e) => {
                  if (e.pointerType === "mouse") {
                    setHoveredTooltip(null);
                  }

                  setScaledDownElementIndex(-1);
                }}
                onPointerDown={() => {
                  setScaledDownElementIndex(index);
                }}
                onClick={() => {
                  updateLocalStoragePlayerMetadata({
                    avatarPath: playerMetadata[userID]?.avatarPath || "",
                    color: playerMetadata[userID]?.color || "",
                    deckVariant: variant,
                    deckHueRotation:
                      playerMetadata[userID]?.deckHueRotation || 0,
                  });

                  setDeckVariant(variant);

                  if (setLocalPlayerSettings === undefined) return;

                  setLocalPlayerSettings((localPlayerSettings) => {
                    return {
                      ...localPlayerSettings,
                      deckVariant: variant,
                    };
                  });
                }}
              >
                <div
                  className={`transition-transform ${
                    scaledDownElementIndex === index ? "scale-95" : ""
                  }`}
                >
                  <StaticCard
                    suit={"C"}
                    value={"8"}
                    deckVariant={variant}
                    showCardBack={false}
                    width={64}
                    height={87}
                  />
                </div>
              </div>
              <span>
                {variant}
                {variant === "Antique" && <span className="ml-0.5">*</span>}
              </span>
            </div>
          ))}
        </div>

        <div className="baseFlex gap-1.5 text-sm">
          * Made by
          <a
            href="https://jackiestudenski.portfolio.site/"
            target="_blank"
            rel="noreferrer"
            className="baseFlex gap-1 text-darkGreen underline underline-offset-4"
          >
            Jackie Studenski
            <HiExternalLink className="size-4 text-darkGreen" />
          </a>
        </div>
      </div>
    );
  }

  function renderDeckTooltip() {
    return (
      <div
        className={`h-[22rem] w-[22rem] grid-cols-3 grid-rows-3 gap-4 md:h-[18rem] md:w-[25rem] md:grid-cols-4 md:grid-rows-2 tablet:gap-0 ${forSheet ? "bg-zinc-200" : ""} grid place-items-center rounded-md p-4 transition-all`}
      >
        {Object.keys(oklchToDeckHueRotations).map((color, index) => (
          <div
            key={`${color}-${index}`}
            style={{
              outline: calculateOutline("back", index),
              cursor: isTooltipOptionAvailable("back", index)
                ? "pointer"
                : "auto",
              pointerEvents: isTooltipOptionAvailable("back", index)
                ? "auto"
                : "none",
            }}
            className="relative shrink-0 rounded-sm outline-offset-4 transition-all"
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") {
                setHoveredTooltip({ type: "back", index });
              }

              setScaledDownElementIndex(index);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") {
                setHoveredTooltip(null);
              }

              setScaledDownElementIndex(-1);
            }}
            onPointerCancel={(e) => {
              if (e.pointerType === "mouse") {
                setHoveredTooltip(null);
              }

              setScaledDownElementIndex(-1);
            }}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse") {
                setScaledDownElementIndex(index);
              }
            }}
            onClick={() => {
              // if user is connected to room
              if (connectedToRoom) {
                socket.emit("updatePlayerMetadata", {
                  newPlayerMetadata: {
                    ...playerMetadata[userID],
                    deckHueRotation:
                      oklchToDeckHueRotations[
                        color as keyof typeof oklchToDeckHueRotations // seems hacky
                      ],
                    color,
                  },
                  playerID: userID,
                  roomCode: roomConfig.code,
                } as IUpdatePlayerMetadata);
              }
              // if user is not connected to room
              else {
                updateLocalStoragePlayerMetadata({
                  avatarPath: playerMetadata[userID]?.avatarPath || "",
                  color,
                  deckVariant,
                  deckHueRotation:
                    oklchToDeckHueRotations[
                      color as keyof typeof oklchToDeckHueRotations
                    ],
                });

                setPlayerMetadata({
                  ...playerMetadata,
                  [userID]: {
                    ...playerMetadata[userID],
                    color,
                    deckHueRotation:
                      oklchToDeckHueRotations[
                        color as keyof typeof oklchToDeckHueRotations // seems hacky
                      ],
                  } as IRoomPlayer,
                });
              }

              // not sure why this reset is necessary only on card back picker instead of
              // avatar/front card pickers. but this just standardizes the behavior
              setHoveredTooltip(null);
              setScaledDownElementIndex(-1);
            }}
          >
            <div
              className={`transition-transform ${scaledDownElementIndex === index ? "scale-95" : ""}`}
            >
              <StaticCard
                suit={"C"}
                value={"8"}
                deckVariant={deckVariant}
                hueRotation={
                  oklchToDeckHueRotations[
                    color as keyof typeof oklchToDeckHueRotations // seems hacky
                  ]
                }
                showCardBack={true}
                width={64}
                height={87}
              />
            </div>

            {connectedToRoom &&
              getMetadataOfPlayerByAttribute(color, "back") !==
                playerMetadata[userID]?.avatarPath &&
              getMetadataOfPlayerByAttribute(color, "back") !== "" && (
                <div className="absolute bottom-[-0.75rem] right-[-0.75rem] z-[150] h-12 w-12 rounded-[50%] outline outline-[1px] outline-zinc-200">
                  <PlayerIcon
                    avatarPath={getMetadataOfPlayerByAttribute(color, "back")}
                    borderColor={"transparent"}
                    size="3rem"
                  />
                </div>
              )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {userID && type === "avatar" && renderAvatarTooltip()}
      {userID && type === "front" && renderCardFrontTooltip()}
      {userID && type === "back" && renderDeckTooltip()}
    </>
  );
}

export default PlayerCustomizationPicker;
