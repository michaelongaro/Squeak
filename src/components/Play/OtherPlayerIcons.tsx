import { useState, useLayoutEffect, useRef } from "react";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { AnimatePresence, motion } from "framer-motion";

function OtherPlayerIcons() {
  const userID = useUserIDContext();

  const { gameData, playerMetadata, viewportLabel } = useRoomContext();

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

  const otherPlayerIDs = Object.keys(gameData.players).filter(
    (playerID) => playerID !== userID,
  );

  // maybe turn into actual state?
  const playerIDsShowingSqueakButton: {
    [playerID: string]: boolean;
  } = {};

  for (const id of otherPlayerIDs) {
    playerIDsShowingSqueakButton[id] =
      gameData.players[id]?.squeakDeck.length === 0;
  }

  // probably easier to adj offsets for squeak button based on initial position of
  // containers, and only recalculate if those values have changed
  useLayoutEffect(() => {
    function handleResize() {
      setTimeout(() => {
        const tempAbsolutePositioning = [
          { top: "0px", left: "0px" },
          { top: "0px", left: "0px" },
          { top: "0px", left: "0px" },
        ];

        const withinIconOnlyViewportRange =
          (window.innerWidth >= 1000 && window.innerWidth <= 1500) ||
          (window.innerHeight >= 700 && window.innerHeight <= 800);

        for (let i = 0; i < otherPlayerIDs.length; i++) {
          const playerID = otherPlayerIDs[i];
          if (!playerID) continue;

          const playerContainer = document
            .getElementById(`${playerID}container`)
            ?.getBoundingClientRect();

          if (i === 0 && playerContainer) {
            const topPlayerIconWidth =
              topPlayerIconRef.current?.getBoundingClientRect().width || 0;

            if (withinIconOnlyViewportRange) {
              tempAbsolutePositioning[0] = {
                top: `${playerContainer.top - 15}px`, // gets a 13px offset from closest edge of board
                left: `${playerContainer.left - topPlayerIconWidth / 4}px`,
              };
            } else {
              tempAbsolutePositioning[0] = {
                top: `${playerContainer.top + 15}px`,
                left: `${playerContainer.left - topPlayerIconWidth - 15}px`,
              };
            }
          } else if (i === 1 && playerContainer) {
            if (withinIconOnlyViewportRange) {
              tempAbsolutePositioning[1] = {
                top: `${playerContainer.top}px`,
                left: `${playerContainer.left - 5}px`, // gets a 13px offset from closest edge of board
              };
            } else {
              tempAbsolutePositioning[1] = {
                top: `${playerContainer.bottom + 15}px`,
                left: `${playerContainer.left}px`, // + 15 too ?
              };
            }
          } else if (i === 2 && playerContainer) {
            const rightPlayerIconWidth =
              rightPlayerIconRef.current?.getBoundingClientRect().width || 0;

            if (withinIconOnlyViewportRange) {
              tempAbsolutePositioning[2] = {
                top: `${playerContainer.top}px`,
                left: `${playerContainer.left - 9}px`, // gets a 13px offset from closest edge of board
              };
            } else {
              tempAbsolutePositioning[2] = {
                top: `${playerContainer.top - 85}px`,
                left: `${playerContainer.right - rightPlayerIconWidth - 15}px`,
              };
            }
          }
        }

        setAbsolutePositioning(tempAbsolutePositioning);
      }, 50);
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [absolutePositioning, otherPlayerIDs, gameData.players]);

  return (
    <>
      <AnimatePresence mode="wait">
        {otherPlayerIDs.length >= 1 &&
          otherPlayerIDs[0] &&
          (viewportLabel === "desktop" ||
            !playerIDsShowingSqueakButton[otherPlayerIDs[0]]) && (
            <motion.div
              key={`otherPlayerIcon${otherPlayerIDs[0]}`}
              ref={topPlayerIconRef}
              initial={{ scale: 0.75 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.75 }}
              style={{
                ...absolutePositioning[0],
                opacity: gameData.playerIDsThatLeftMidgame.includes(
                  otherPlayerIDs[0],
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
            </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {otherPlayerIDs.length >= 2 &&
          otherPlayerIDs[1] &&
          (viewportLabel === "desktop" ||
            !playerIDsShowingSqueakButton[otherPlayerIDs[1]]) && (
            <motion.div
              key={`otherPlayerIcon${otherPlayerIDs[1]}`}
              initial={{ scale: 0.75 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.75 }}
              style={{
                ...absolutePositioning[1],
                opacity: gameData.playerIDsThatLeftMidgame.includes(
                  otherPlayerIDs[1],
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
            </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {otherPlayerIDs.length === 3 &&
          otherPlayerIDs[2] &&
          (viewportLabel === "desktop" ||
            !playerIDsShowingSqueakButton[otherPlayerIDs[2]]) && (
            <motion.div
              key={`otherPlayerIcon${otherPlayerIDs[2]}`}
              ref={rightPlayerIconRef}
              initial={{ scale: 0.75 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.75 }}
              style={{
                ...absolutePositioning[2],
                opacity: gameData.playerIDsThatLeftMidgame.includes(
                  otherPlayerIDs[2],
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
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}

export default OtherPlayerIcons;
