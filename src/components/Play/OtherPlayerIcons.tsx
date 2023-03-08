import { useState, useEffect, useRef } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import PlayerIcon from "../playerIcons/PlayerIcon";

function OtherPlayerIcons() {
  const { gameData, playerMetadata } = useRoomContext();
  const { value: userID } = useUserIDContext();

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

  useEffect(() => {
    if (absolutePositioning[0]?.top !== "0px" || otherPlayerIDs.length === 0)
      return;

    const tempAbsolutePositioning = [
      { top: "0px", left: "0px" },
      { top: "0px", left: "0px" },
      { top: "0px", left: "0px" },
    ];

    for (let i = 0; i < otherPlayerIDs.length; i++) {
      const playerID = otherPlayerIDs[i];
      if (!playerID) continue;

      const playerSqueakDeckEmpty =
        gameData.players[playerID]?.squeakDeck.length === 0 ? true : false;

      const playerContainer = document
        .getElementById(`${playerID}container`)
        ?.getBoundingClientRect();

      if (i === 0 && playerContainer) {
        const topPlayerIconWidth =
          topPlayerIconRef.current?.getBoundingClientRect().width || 0;

        tempAbsolutePositioning[0] = {
          top: `${playerContainer.top + 15}px`,
          left: `${
            playerContainer.left -
            topPlayerIconWidth -
            (playerSqueakDeckEmpty ? 35 : 15)
          }px`,
        };
      } else if (i === 1 && playerContainer) {
        tempAbsolutePositioning[1] = {
          top: `${
            playerContainer.bottom + (playerSqueakDeckEmpty ? 35 : 15)
          }px`,
          left: `${playerContainer.left}px`, // + 15 too ?
        };
      } else if (i === 2 && playerContainer) {
        const rightPlayerIconWidth =
          rightPlayerIconRef.current?.getBoundingClientRect().width || 0;

        tempAbsolutePositioning[2] = {
          top: `${playerContainer.top - (playerSqueakDeckEmpty ? 105 : 85)}}px`,
          left: `${playerContainer.right - rightPlayerIconWidth - 15}px`,
        };
      }
    }

    setAbsolutePositioning([...tempAbsolutePositioning]);
  }, [absolutePositioning, otherPlayerIDs, gameData.players]);

  return (
    <>
      {otherPlayerIDs.length >= 1 && otherPlayerIDs[0] && (
        <div
          ref={topPlayerIconRef}
          style={{
            ...absolutePositioning[0],
          }}
          className="absolute"
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
          }}
          className="absolute"
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
          }}
          className="absolute"
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
