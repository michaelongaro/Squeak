import { useState } from "react";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "../Play/Card";
import PlayerIcon from "./PlayerIcon";

import { avatarPaths } from "../../utils/avatarPaths";
import { deckHueRotations } from "../../utils/deckHueRotations";
import { rgbToDeckHueRotations } from "../../utils/rgbToDeckHueRotations";

interface IPickerTooltip {
  type: "avatar" | "deck";
}

function PickerTooltip({ type }: IPickerTooltip) {
  const roomCtx = useRoomContext();

  const localStorageID = useLocalStorageContext();
  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

  const [showToolTip, setShowToolTip] = useState<boolean>(false);

  return (
    <>
      {userID && (
        <div className="relative">
          {/* picker tooltip */}
          <div
            // most likely going to need to calculate the top/left values from this div
            style={{
              // left/top

              opacity: showToolTip ? 1 : 0,
              pointerEvents: showToolTip ? "auto" : "none",
              gridTemplateColumns:
                type === "avatar" ? "1fr 1fr 1fr" : "1fr 1fr 1fr 1fr",
              gridTemplateRows: type === "avatar" ? "1fr 1fr 1fr" : "1fr 1fr",
            }}
            className="absolute grid h-fit w-fit rounded-md bg-white p-4 shadow-md transition-all"
          >
            {/* probably want to copy same setup as dash w/ selecting pinned drawings,
            where you ahve light green opacity when hovering on valid one and regular green around
            currently selected one. also probably a good idea to have a bit of an offset w/ "outline-offset": 4px
             or something */}
            {type === "avatar"
              ? avatarPaths.map((avatarPath, i) => (
                  <PlayerIcon
                    key={i}
                    avatarPath={avatarPath}
                    borderColor={
                      roomCtx.playerMetadata[userID]?.avatarPath === avatarPath
                        ? "green"
                        : "transparent"
                    }
                    iconOpacity={
                      // prob extract to an effect + state
                      Object.keys(roomCtx.playerMetadata[userID]!)?.some(
                        (player) => {
                          return (
                            roomCtx.playerMetadata[player]?.avatarPath ===
                            avatarPath
                          );
                        }
                      )
                        ? 0.5
                        : 1
                    }
                    size="3rem"
                    cursorType="pointer"
                    showOutline={
                      roomCtx.playerMetadata[userID]?.avatarPath === avatarPath
                    }
                  />
                ))
              : deckHueRotations.map((hueRotation, i) => (
                  <Card
                    key={i}
                    showCardBack={true}
                    draggable={false}
                    rotation={0}
                    hueRotation={hueRotation}
                  />
                ))}
          </div>

          {/* preview */}
          {/* should hide tooltip when clicking outside of it */}

          <div onClick={() => setShowToolTip(true)}>
            {type === "avatar" ? (
              <PlayerIcon
                avatarPath={
                  roomCtx.playerMetadata[userID]?.avatarPath ||
                  "/avatars/squirrel.svg"
                }
                borderColor={
                  roomCtx.playerMetadata[userID]?.color || "rgb(220, 55, 76)"
                }
                size="3rem"
                cursorType="pointer"
              />
            ) : (
              <Card
                draggable={false}
                rotation={0}
                showCardBack={true}
                ownerID={userID}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default PickerTooltip;
