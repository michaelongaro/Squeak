import PlayerIcon from "./PlayerIcon";
import { useUserIDContext } from "~/context/UserIDContext";
import { useRoomContext } from "~/context/RoomContext";
import { type IRoomPlayersMetadata } from "~/pages/api/socket";
import StaticCard from "~/components/Play/StaticCard";

interface IPlayerCustomizationPicker {
  renderedView: "avatar" | "front" | "back";
  forSheet?: boolean;
  forCreateAndJoin?: boolean;
  useDarkerFont?: boolean;
  transparentAvatarBackground?: boolean;
  renderDescriptionText?: boolean;
  localPlayerMetadata?: IRoomPlayersMetadata;
}
function PlayerCustomizationPreview({
  renderedView,
  forSheet,
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
            paddingTop: forCreateAndJoin ? "0.55rem" : 0,
          }}
        />
        {renderDescriptionText && (
          <p
            style={{
              paddingTop: forSheet ? "0" : "0.85rem",
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
        <StaticCard
          suit={"C"}
          value={"8"}
          deckVariantIndex={deckVariantIndex}
          showCardBack={true}
          hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
          width={48}
          height={64}
        />

        {renderDescriptionText && (
          <p
            className={`${
              useDarkerFont
                ? "text-lg font-semibold text-darkGreen"
                : "text-lightGreen"
            }`}
          >
            {forSheet ? "Card back" : "Back"}
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <StaticCard
        suit={"C"}
        value={"8"}
        deckVariantIndex={deckVariantIndex}
        showCardBack={false}
        width={48}
        height={64}
      />

      {renderDescriptionText && (
        <p
          className={`${
            useDarkerFont
              ? "text-lg font-semibold text-darkGreen"
              : "text-lightGreen"
          }`}
        >
          {forSheet ? "Card front" : "Front"}
        </p>
      )}
    </>
  );
}

export default PlayerCustomizationPreview;
