import React from "react";
import Card from "../Play/Card";
import PlayerIcon from "./PlayerIcon";
import { type IRoomPlayersMetadata } from "~/pages/api/socket";
import { useMainStore } from "~/stores/MainStore";
import useGetUserID from "~/hooks/useGetUserID";

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
  const userID = useGetUserID();

  const { playerMetadata: storePlayerMetadata, prefersSimpleCardAssets } =
    useMainStore((state) => ({
      playerMetadata: state.playerMetadata,
      prefersSimpleCardAssets: state.prefersSimpleCardAssets,
    }));

  console.log("rendered, preview");

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
              color: useDarkerFont
                ? "hsl(120deg, 100%, 18%)"
                : "hsl(120deg, 100%, 86%)",
              paddingTop: forDrawer ? "0" : "0.85rem",
            }}
            className={`${useDarkerFont ? "text-lg font-semibold" : ""}`}
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
            Back
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
        manuallyShowSpecificCardFront={
          prefersSimpleCardAssets ? "simple" : "normal"
        }
      />
      {renderDescriptionText && (
        <p
          className={`${
            useDarkerFont
              ? "text-lg font-semibold text-darkGreen"
              : "text-lightGreen"
          }`}
        >
          Front
        </p>
      )}
    </>
  );
}

export default PlayerCustomizationPreview;
