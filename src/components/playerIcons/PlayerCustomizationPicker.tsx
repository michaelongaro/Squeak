import { useEffect, useState } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { socket } from "../../pages";
import {
  type IRoomPlayer,
  type IRoomPlayersMetadata,
  type IUpdatePlayerMetadata,
} from "../../pages/api/socket";
import { avatarPaths } from "../../utils/avatarPaths";
import { deckHueRotations } from "../../utils/deckHueRotations";
import { hslToDeckHueRotations } from "../../utils/hslToDeckHueRotations";
import Card from "../Play/Card";
import { type ILocalPlayerSettings } from "../modals/SettingsAndStats/UserSettingsAndStatsModal";
import PlayerIcon from "./PlayerIcon";

interface IPlayerCustomizationPicker {
  type: "avatar" | "back" | "front";
  localPlayerMetadata?: IRoomPlayersMetadata;
  setLocalPlayerMetadata?: React.Dispatch<
    React.SetStateAction<IRoomPlayersMetadata>
  >;
  setLocalPlayerSettings?: React.Dispatch<
    React.SetStateAction<ILocalPlayerSettings>
  >;
  forDrawer?: boolean;
}

function PlayerCustomizationPicker({
  type,
  localPlayerMetadata,
  setLocalPlayerMetadata,
  setLocalPlayerSettings,
  forDrawer,
}: IPlayerCustomizationPicker) {
  const userID = useUserIDContext();

  const {
    playerMetadata: storePlayerMetadata,
    setPlayerMetadata: storeSetPlayerMetadata,
    connectedToRoom: storeConnectedToRoom,
    roomConfig,
    prefersSimpleCardAssets,
    setPrefersSimpleCardAssets,
  } = useRoomContext();

  // dynamic values depending on if parent is being used in <Settings /> or not
  const playerMetadata = localPlayerMetadata ?? storePlayerMetadata;
  const setPlayerMetadata = setLocalPlayerMetadata ?? storeSetPlayerMetadata;
  const connectedToRoom = localPlayerMetadata ? false : storeConnectedToRoom;

  const [hoveredTooltip, setHoveredTooltip] = useState<
    ["avatar" | "back", number] | null
  >(null);
  const [hoveringOnFrontCardTooltip, setHoveringOnFrontCardTooltip] = useState<
    "normal" | "simple" | null
  >(null);

  const [userAvatarIndex, setUserAvatarIndex] = useState<number>(-1);
  const [userDeckIndex, setUserDeckIndex] = useState<number>(-1);

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

  function isTooltipOptionAvailable(
    type: "avatar" | "back",
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

  function calculateOutline(type: "avatar" | "back", index: number): string {
    if (
      (type === "avatar" && userAvatarIndex === index) ||
      (type === "back" && userDeckIndex === index)
    )
      return "4px solid hsl(120deg 100% 18%)";

    if (!isTooltipOptionAvailable(type, index)) return "4px solid transparent";

    return hoveredTooltip &&
      hoveredTooltip[0] === type &&
      hoveredTooltip[1] === index
      ? "4px solid hsl(120deg 100% 40%)"
      : "4px solid transparent";
  }

  function calculateOutlineCardFront(
    tooltipValue: "normal" | "simple"
  ): string {
    if (
      (prefersSimpleCardAssets && tooltipValue === "simple") ||
      (!prefersSimpleCardAssets && tooltipValue === "normal")
    )
      return "4px solid hsl(120deg 100% 18%)";

    return hoveringOnFrontCardTooltip === tooltipValue
      ? "4px solid hsl(120deg 100% 40%)"
      : "4px solid transparent";
  }

  function getMetadataOfPlayerByAttribute(
    attribute: string,
    type: "avatar" | "back"
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

  function renderTooltip() {
    if (type === "avatar") {
      return renderAvatarTooltip();
    } else if (type === "back") {
      return renderDeckTooltip();
    }

    return renderCardFrontTooltip();
  }

  function renderAvatarTooltip() {
    return avatarPaths.map((avatarPath, index) => (
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
        className="relative rounded-[50%] outline-offset-4 transition-all"
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
        <PlayerIcon
          avatarPath={avatarPath}
          borderColor={"transparent"}
          size="4rem"
          transparentBackground
        />
        {getMetadataOfPlayerByAttribute(avatarPath, "avatar") !==
          playerMetadata[userID]?.color &&
          getMetadataOfPlayerByAttribute(avatarPath, "avatar") !== "" && (
            <div
              style={{
                backgroundColor: getMetadataOfPlayerByAttribute(
                  avatarPath,
                  "avatar"
                ),
              }}
              className="absolute bottom-[-0.75rem] right-[-0.75rem] h-4 w-4 rounded-[50%]"
            ></div>
          )}
      </div>
    ));
  }

  function renderDeckTooltip() {
    return Object.keys(hslToDeckHueRotations).map((color, index) => (
      <div
        key={`${color}-${index}`}
        style={{
          outline: calculateOutline("back", index),
          cursor: isTooltipOptionAvailable("back", index) ? "pointer" : "auto",
          pointerEvents: isTooltipOptionAvailable("back", index)
            ? "auto"
            : "none",
        }}
        className="relative rounded-sm outline-offset-4 transition-all"
        onMouseEnter={() => setHoveredTooltip(["back", index])}
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
            setPlayerMetadata({
              ...playerMetadata,
              [userID]: {
                ...playerMetadata[userID],
                color,
                deckHueRotation:
                  hslToDeckHueRotations[
                    color as keyof typeof hslToDeckHueRotations // seems hacky
                  ],
              } as IRoomPlayer,
            });
          }
        }}
      >
        <Card
          showCardBack={true}
          draggable={false}
          rotation={0}
          width={64}
          height={87}
          hueRotation={
            hslToDeckHueRotations[
              color as keyof typeof hslToDeckHueRotations // seems hacky
            ]
          }
        />
        <div className="absolute bottom-[-0.75rem] right-[-0.75rem] z-[150] h-12 w-12 rounded-[50%]">
          {getMetadataOfPlayerByAttribute(color, "back") !==
            playerMetadata[userID]?.avatarPath &&
            getMetadataOfPlayerByAttribute(color, "back") !== "" && (
              <PlayerIcon
                avatarPath={getMetadataOfPlayerByAttribute(color, "back")}
                borderColor={"transparent"}
                size="3rem"
              />
            )}
        </div>
      </div>
    ));
  }

  function renderCardFrontTooltip() {
    return (
      <>
        <div
          style={{
            outline: calculateOutlineCardFront("normal"),
          }}
          className="relative rounded-sm outline-offset-4 transition-all"
          onMouseEnter={() => setHoveringOnFrontCardTooltip("normal")}
          onMouseLeave={() => setHoveringOnFrontCardTooltip(null)}
          onClick={() => {
            setPrefersSimpleCardAssets(false);

            if (setLocalPlayerSettings === undefined) return;

            setLocalPlayerSettings((localPlayerSettings) => {
              return {
                ...localPlayerSettings,
                prefersSimpleCardAssets: false,
              };
            });
          }}
        >
          <Card
            value={"8"}
            suit={"C"}
            showCardBack={false}
            draggable={false}
            rotation={0}
            width={64}
            height={87}
            hueRotation={0}
            manuallyShowSpecificCardFront={"normal"}
          />
        </div>
        <div
          style={{
            outline: calculateOutlineCardFront("simple"),
            cursor: !prefersSimpleCardAssets ? "pointer" : "auto",
            pointerEvents: !prefersSimpleCardAssets ? "auto" : "none",
          }}
          className="relative rounded-sm outline-offset-4 transition-all"
          onMouseEnter={() => setHoveringOnFrontCardTooltip("simple")}
          onMouseLeave={() => setHoveringOnFrontCardTooltip(null)}
          onClick={() => {
            setPrefersSimpleCardAssets(true);

            if (setLocalPlayerSettings === undefined) return;

            setLocalPlayerSettings((localPlayerSettings) => {
              return {
                ...localPlayerSettings,
                prefersSimpleCardAssets: true,
              };
            });
          }}
        >
          <Card
            value={"8"}
            suit={"C"}
            showCardBack={false}
            draggable={false}
            rotation={0}
            width={64}
            height={87}
            hueRotation={0}
            manuallyShowSpecificCardFront={"simple"}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {userID && (
        <div
          className={`
              ${
                type === "avatar"
                  ? "h-[18rem] w-[18rem] grid-cols-3 grid-rows-3 md:h-[20rem] md:w-[20rem]"
                  : type === "back"
                  ? "h-[22rem] w-[22rem] grid-cols-3 grid-rows-3 md:h-[18rem] md:w-[25rem] md:grid-cols-4 md:grid-rows-2"
                  : "h-[10rem] w-[15rem] grid-cols-2 grid-rows-1"
              }
              ${forDrawer ? "bg-zinc-200" : "white"}
              grid place-items-center rounded-md p-4 transition-all`}
        >
          {renderTooltip()}
        </div>
      )}
    </>
  );
}

export default PlayerCustomizationPicker;
