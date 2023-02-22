import { useState, useEffect } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { socket } from "../../pages";
import Board from "./Board";
import PlayerCardContainer from "./PlayerCardContainer";
import OtherPlayersCardContainers from "./OtherPlayersCardContainers";
import Scoreboard from "../modals/Scoreboard/Scoreboard";
import ShufflingCountdownModal from "../modals/ShufflingCountdownModal";
import useStartAnotherRoundHandler from "../../hooks/useStartAnotherRoundHandler";
import useReturnToRoomHandler from "../../hooks/useReturnToRoomHandler";
import { AnimatePresence, motion } from "framer-motion";

import classes from "./Play.module.css";
import { useUserIDContext } from "../../context/UserIDContext";

function Play() {
  const {
    gameData,
    roomConfig,
    setGameData,
    showScoreboard,
    showShufflingCountdown,
    setShowShufflingCountdown,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const [gameStarted, setGameStarted] = useState<boolean>(false);

  useStartAnotherRoundHandler();
  useReturnToRoomHandler();

  useEffect(() => {
    if (gameData?.board === undefined && gameData?.players === undefined) {
      setShowShufflingCountdown(true);

      socket.emit("playerReadyToReceiveInitGameData", roomConfig.code);

      socket.on("initGameData", (initGameData) => {
        setGameData(initGameData);
        socket.emit("playerFullyReady", roomConfig.code);
      });

      socket.on("gameStarted", () => {
        setGameStarted(true);
      });

      socket.emit("modifyFriendData", {
        action: "startGame",
        initiatorID: userID,
      });
    }

    return () => {
      socket.off("initGameData", (initGameData) => {
        setGameData(initGameData);
        socket.emit("playerFullyReady", roomConfig.code);
      });
      socket.off("gameStarted", () => {
        setGameStarted(true);
      });
    };
  }, [
    gameData,
    roomConfig.code,
    setGameData,
    setShowShufflingCountdown,
    userID,
  ]);

  return (
    <motion.div
      key={"play"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        id={"playContainer"}
        className={`${classes.fullBoardGrid} relative z-[999]`}
      >
        {gameStarted && (
          <>
            <OtherPlayersCardContainers
              orderedClassNames={[
                classes.topPlayerCards,
                classes.leftPlayerCards,
                classes.rightPlayerCards,
              ]}
            />

            <Board boardClass={classes.board} />

            <PlayerCardContainer
              cardContainerClass={classes.currentPlayerCards}
            />
          </>
        )}
      </div>

      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {showShufflingCountdown && <ShufflingCountdownModal />}
      </AnimatePresence>

      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {showScoreboard && <Scoreboard />}
      </AnimatePresence>
    </motion.div>
  );
}

export default Play;
