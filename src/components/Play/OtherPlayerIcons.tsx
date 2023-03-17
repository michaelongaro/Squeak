import { useState, useEffect, useRef } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import PlayerIcon from "../playerIcons/PlayerIcon";

function OtherPlayerIcons() {
  const { gameData, playerMetadata } = useRoomContext();
  const userID = useUserIDContext();

  const otherPlayerIDs = Object.keys(gameData.players).filter(
    (playerID) => playerID !== userID
  );

  // don't need leftPlayerIconRef since it is flows left-to-right already
  // and doesn't need any offset positioning wise.
  const topPlayerIconRef = useRef<HTMLDivElement>(null);
  const rightPlayerIconRef = useRef<HTMLDivElement>(null);

  const [absolutePositioning, setAbsolutePositioning] = useState<
    { top: string; left: string }[]
  >([
    { top: "0px", left: "0px" },
    { top: "0px", left: "0px" },
    { top: "0px", left: "0px" },
  ]);

  // this is needed because the squeak button is wider than a
  // regular card, and pushes the container to be wider
  // since the other player icons are positioned absolutely,
  // we need to update to the new location so it doesn't get cut off.
  const [
    prevNumPlayersShowingSqueakButton,
    setPrevNumPlayersShowingSqueakButton,
  ] = useState<number>(0);

  let numPlayersShowingSqueakButton = 0;

  for (const id of otherPlayerIDs) {
    if (gameData.players[id]?.squeakDeck.length === 0) {
      numPlayersShowingSqueakButton++;
    }
  }

  useEffect(() => {
    if (
      absolutePositioning[0]?.top !== "0px" &&
      prevNumPlayersShowingSqueakButton === numPlayersShowingSqueakButton
    )
      return;

    const tempAbsolutePositioning = [
      { top: "0px", left: "0px" },
      { top: "0px", left: "0px" },
      { top: "0px", left: "0px" },
    ];

    for (let i = 0; i < otherPlayerIDs.length; i++) {
      const playerID = otherPlayerIDs[i];
      if (!playerID) continue;

      const playerContainer = document
        .getElementById(`${playerID}container`)
        ?.getBoundingClientRect();

      if (i === 0 && playerContainer) {
        const topPlayerIconWidth =
          topPlayerIconRef.current?.getBoundingClientRect().width || 0;

        tempAbsolutePositioning[0] = {
          top: `${playerContainer.top + 15}px`,
          left: `${playerContainer.left - topPlayerIconWidth - 15}px`,
        };
      } else if (i === 1 && playerContainer) {
        tempAbsolutePositioning[1] = {
          top: `${playerContainer.bottom + 15}px`,
          left: `${playerContainer.left}px`, // + 15 too ?
        };
      } else if (i === 2 && playerContainer) {
        const rightPlayerIconWidth =
          rightPlayerIconRef.current?.getBoundingClientRect().width || 0;

        tempAbsolutePositioning[2] = {
          top: `${playerContainer.top - 85}px`,
          left: `${playerContainer.right - rightPlayerIconWidth - 15}px`,
        };
      }
    }

    setAbsolutePositioning(tempAbsolutePositioning);
    setPrevNumPlayersShowingSqueakButton(numPlayersShowingSqueakButton);
  }, [
    absolutePositioning,
    numPlayersShowingSqueakButton,
    prevNumPlayersShowingSqueakButton,
    otherPlayerIDs,
    gameData.players,
  ]);

  return (
    <>
      {otherPlayerIDs.length >= 1 && otherPlayerIDs[0] && (
        <div
          ref={topPlayerIconRef}
          style={{
            ...absolutePositioning[0],
            opacity: gameData.playerIDsThatLeftMidgame.includes(
              otherPlayerIDs[0]
            )
              ? 0.25
              : 1,
          }}
          className="absolute transition-opacity"
        >
          <PlayerIcon
            avatarPath={
              playerMetadata[otherPlayerIDs[0]]?.avatarPath ||
              "/avatars/rabbit.svg"
            }
            borderColor={
              playerMetadata[otherPlayerIDs[0]]?.color ||
              "hsl(352deg, 69%, 61%)"
            }
            username={playerMetadata[otherPlayerIDs[0]]?.username}
            size={"3rem"}
          />
        </div>
      )}

      {otherPlayerIDs.length >= 2 && otherPlayerIDs[1] && (
        <div
          style={{
            ...absolutePositioning[1],
            opacity: gameData.playerIDsThatLeftMidgame.includes(
              otherPlayerIDs[1]
            )
              ? 0.25
              : 1,
          }}
          className="absolute transition-opacity"
        >
          <PlayerIcon
            avatarPath={
              playerMetadata[otherPlayerIDs[1]]?.avatarPath ||
              "/avatars/rabbit.svg"
            }
            borderColor={
              playerMetadata[otherPlayerIDs[1]]?.color ||
              "hsl(352deg, 69%, 61%)"
            }
            username={playerMetadata[otherPlayerIDs[1]]?.username}
            size={"3rem"}
          />
        </div>
      )}

      {otherPlayerIDs.length === 3 && otherPlayerIDs[2] && (
        <div
          ref={rightPlayerIconRef}
          style={{
            ...absolutePositioning[2],
            opacity: gameData.playerIDsThatLeftMidgame.includes(
              otherPlayerIDs[2]
            )
              ? 0.25
              : 1,
          }}
          className="absolute transition-opacity"
        >
          <PlayerIcon
            avatarPath={
              playerMetadata[otherPlayerIDs[2]]?.avatarPath ||
              "/avatars/rabbit.svg"
            }
            borderColor={
              playerMetadata[otherPlayerIDs[2]]?.color ||
              "hsl(352deg, 69%, 61%)"
            }
            username={playerMetadata[otherPlayerIDs[2]]?.username}
            size={"3rem"}
          />
        </div>
      )}
    </>
  );
}

export default OtherPlayerIcons;
