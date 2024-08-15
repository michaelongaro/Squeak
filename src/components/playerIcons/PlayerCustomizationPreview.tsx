import React from "react";
import Card from "../Play/Card";
import PlayerIcon from "./PlayerIcon";
import { useUserIDContext } from "~/context/UserIDContext";
import { useRoomContext } from "~/context/RoomContext";
import { type IRoomPlayersMetadata } from "~/pages/api/socket";

interface IPlayerCustomizationPicker {
  renderedView: "avatar" | "front" | "back";
  forDrawer?: boolean;
  forCreateAndJoin?: boolean;
  useDarkerFont?: boolean;
  transparentAvatarBackground?: boolean;
  renderDescriptionText?: boolean;
  localPlayerMetadata?: IRoomPlayersMetadata;
}
function PlayerCustomizationPreview({
  renderedView,
  forDrawer,
  forCreateAndJoin,
  useDarkerFont,
  transparentAvatarBackground,
  renderDescriptionText = true,
  localPlayerMetadata,
}: IPlayerCustomizationPicker) {
  const userID = useUserIDContext();

  const { playerMetadata: storePlayerMetadata, deckVariantIndex } =
    useRoomContext();

  const playerMetadata = localPlayerMetadata ?? storePlayerMetadata;

  if (renderedView === "avatar") {
    return (
      <>
        <PlayerIcon
          avatarPath={
            playerMetadata[userID]?.avatarPath || "/avatars/rabbit.svg"
          }
          borderColor={playerMetadata[userID]?.color || "#000000"}
          size="3rem" // hopefully doesn't mess up positioning near player container on play
          transparentBackground={transparentAvatarBackground}
          style={{
            marginTop: forCreateAndJoin ? "0.55rem" : 0,
          }}
        />
        {renderDescriptionText && (
          <p
            style={{
              paddingTop: forDrawer ? "0" : "0.85rem",
            }}
            className={`${useDarkerFont ? "text-lg font-semibold text-darkGreen" : "text-lightGreen"}`}
          >
            Avatar
          </p>
        )}
      </>
    );
  } else if (renderedView === "back") {
    return (
      <>
        <Card
          draggable={false}
          rotation={0}
          showCardBack={true}
          ownerID={userID}
          width={48} // roughly correct for ratio of a card
          height={64}
          hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
        />
        {renderDescriptionText && (
          <p
            className={`${
              useDarkerFont
                ? "text-lg font-semibold text-darkGreen"
                : "text-lightGreen"
            }`}
          >
            {forDrawer ? "Card back" : "Back"}
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <Card
        draggable={false}
        rotation={0}
        showCardBack={false}
        ownerID={userID}
        suit={"C"}
        value={"8"}
        width={48} // roughly correct for ratio of a card
        height={64}
        hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
        manuallyShowSpecificCardFront={deckVariantIndex}
      />
      {renderDescriptionText && (
        <p
          className={`${
            useDarkerFont
              ? "text-lg font-semibold text-darkGreen"
              : "text-lightGreen"
          }`}
        >
          {forDrawer ? "Card front" : "Front"}
        </p>
      )}
    </>
  );
}

export default PlayerCustomizationPreview;
