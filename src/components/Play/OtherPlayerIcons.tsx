import { useState, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { AnimatePresence, motion } from "framer-motion";

// This component was previously rerendering/reinitalizing the resize event listener on every render
// so below is (maybe an overkill?) conservative implementation

function OtherPlayerIcons() {
  const userID = useUserIDContext();

  const { gameData, playerMetadata, viewportLabel } = useRoomContext();

  const firstTopPlayerIconRef = useRef<HTMLDivElement>(null);
  const leftPlayerIconRef = useRef<HTMLDivElement>(null);
  const rightPlayerIconRef = useRef<HTMLDivElement>(null);
  const secondTopPlayerIconRef = useRef<HTMLDivElement>(null);

  const [prevViewportWidth, setPrevViewportWidth] = useState<number>(0);
  const [prevViewportHeight, setPrevViewportHeight] = useState<number>(0);

  const [absolutePositioning, setAbsolutePositioning] = useState<
    { top: string; left: string }[]
  >([
    { top: "-9999px", left: "-9999px" },
    { top: "-9999px", left: "-9999px" },
    { top: "-9999px", left: "-9999px" },
    { top: "-9999px", left: "-9999px" },
  ]);

  const otherPlayerIDs = useMemo(
    () =>
      Object.keys(gameData.players).filter((playerID) => playerID !== userID),
    [gameData.players, userID],
  );

  const playerIDsShowingSqueakButton = useMemo(() => {
    const result: { [playerID: string]: boolean } = {};
    for (const id of otherPlayerIDs) {
      result[id] = gameData.players[id]?.squeakDeck.length === 0;
    }
    return result;
  }, [otherPlayerIDs, gameData.players]);

  const isComponentMounted = useRef(true);

  const handleResize = useCallback(() => {
    if (
      prevViewportWidth === window.innerWidth &&
      prevViewportHeight === window.innerHeight
    ) {
      return;
    }

    const tempAbsolutePositioning = [
      { top: "0px", left: "0px" },
      { top: "0px", left: "0px" },
      { top: "0px", left: "0px" },
      { top: "0px", left: "0px" },
    ];

    const withinIconOnlyViewportRange =
      (window.innerWidth >= 1000 && window.innerWidth < 1500) ||
      (window.innerHeight >= 700 && window.innerHeight < 800);

    for (let i = 0; i < otherPlayerIDs.length; i++) {
      const playerID = otherPlayerIDs[i];
      if (!playerID) continue;

      const playerContainer = document
        .getElementById(`${playerID}container`)
        ?.getBoundingClientRect();

      if (i === 0 && playerContainer) {
        const firstTopPlayerIconWidth =
          firstTopPlayerIconRef.current?.getBoundingClientRect().width || 0;

        if (withinIconOnlyViewportRange) {
          tempAbsolutePositioning[0] = {
            top: `${playerContainer.top - 15}px`, // gets a 13px offset from closest edge of board
            left: `${playerContainer.left - firstTopPlayerIconWidth / 4}px`,
          };
        } else {
          tempAbsolutePositioning[0] = {
            top: `${playerContainer.top + 15}px`,
            left: `${playerContainer.left - firstTopPlayerIconWidth - 15}px`,
          };
        }
      } else if (i === 1 && playerContainer) {
        const leftPlayerIconWidth =
          leftPlayerIconRef.current?.getBoundingClientRect().width || 0;

        if (withinIconOnlyViewportRange) {
          tempAbsolutePositioning[1] = {
            top: `${playerContainer.top}px`,
            left: `${playerContainer.left - leftPlayerIconWidth / 2 - 8}px`, // gets a 13px offset from closest edge of board
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
            left: `${playerContainer.left + rightPlayerIconWidth / 2 - 12}px`, // gets a 13px offset from closest edge of board
          };
        } else {
          tempAbsolutePositioning[2] = {
            top: `${playerContainer.top - 85}px`,
            left: `${playerContainer.right - rightPlayerIconWidth - 15}px`,
          };
        }
      } else if (i === 3 && playerContainer) {
        const secondTopPlayerIconWidth =
          secondTopPlayerIconRef.current?.getBoundingClientRect().width || 0;

        if (withinIconOnlyViewportRange) {
          tempAbsolutePositioning[3] = {
            top: `${playerContainer.top - 15}px`, // gets a 13px offset from closest edge of board
            left: `${playerContainer.left - secondTopPlayerIconWidth / 4}px`,
          };
        } else {
          tempAbsolutePositioning[3] = {
            top: `${playerContainer.top + 15}px`,
            left: `${playerContainer.left - secondTopPlayerIconWidth - 15}px`,
          };
        }
      }

      setAbsolutePositioning(tempAbsolutePositioning);
      setPrevViewportWidth(window.innerWidth);
      setPrevViewportHeight(window.innerHeight);
    }
  }, [prevViewportWidth, prevViewportHeight, otherPlayerIDs]);

  useLayoutEffect(() => {
    setTimeout(() => {
      handleResize();
    }, 250); // flaky: waiting for the player containers to be rendered before positioning the icons

    window.addEventListener("resize", handleResize);

    return () => {
      isComponentMounted.current = false;
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return (
    <>
      <AnimatePresence mode="wait">
        {otherPlayerIDs.length >= 1 &&
          otherPlayerIDs[0] &&
          (viewportLabel === "desktop" ||
            !playerIDsShowingSqueakButton[otherPlayerIDs[0]]) && (
            <motion.div
              key={`otherPlayerIcon${otherPlayerIDs[0]}`}
              ref={firstTopPlayerIconRef}
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
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
                  "oklch(64.02% 0.171 15.38)"
                }
                username={playerMetadata[otherPlayerIDs[0]]?.username}
                size={"3rem"}
                animateLayout={false}
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
              ref={leftPlayerIconRef}
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
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
                  "oklch(64.02% 0.171 15.38)"
                }
                username={playerMetadata[otherPlayerIDs[1]]?.username}
                size={"3rem"}
                animateLayout={false}
              />
            </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {otherPlayerIDs.length >= 3 &&
          otherPlayerIDs[2] &&
          (viewportLabel === "desktop" ||
            !playerIDsShowingSqueakButton[otherPlayerIDs[2]]) && (
            <motion.div
              key={`otherPlayerIcon${otherPlayerIDs[2]}`}
              ref={rightPlayerIconRef}
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
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
                  "oklch(64.02% 0.171 15.38)"
                }
                username={playerMetadata[otherPlayerIDs[2]]?.username}
                size={"3rem"}
                animateLayout={false}
              />
            </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {otherPlayerIDs.length === 4 &&
          otherPlayerIDs[3] &&
          (viewportLabel === "desktop" ||
            !playerIDsShowingSqueakButton[otherPlayerIDs[3]]) && (
            <motion.div
              key={`otherPlayerIcon${otherPlayerIDs[3]}`}
              ref={secondTopPlayerIconRef}
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
              style={{
                ...absolutePositioning[3],
                opacity: gameData.playerIDsThatLeftMidgame.includes(
                  otherPlayerIDs[3],
                )
                  ? 0.25
                  : 1,
              }}
              className="absolute transition-opacity"
            >
              <PlayerIcon
                avatarPath={
                  playerMetadata[otherPlayerIDs[3]]?.avatarPath ||
                  "/avatars/rabbit.svg"
                }
                borderColor={
                  playerMetadata[otherPlayerIDs[3]]?.color ||
                  "oklch(64.02% 0.171 15.38)"
                }
                username={playerMetadata[otherPlayerIDs[3]]?.username}
                size={"3rem"}
                animateLayout={false}
              />
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}

export default OtherPlayerIcons;
