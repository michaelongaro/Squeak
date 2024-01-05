import { useState, useEffect } from "react";
import { socket } from "../../pages";
import Board from "./Board";
import PlayerCardContainer from "./PlayerCardContainer";
import OtherPlayersCardContainers from "./OtherPlayersCardContainers";
import Scoreboard from "../modals/Scoreboard/Scoreboard";
import ShufflingCountdownModal from "../modals/ShufflingCountdownModal";
import useStartAnotherRoundHandler from "../../hooks/useStartAnotherRoundHandler";
import useReturnToRoomHandler from "../../hooks/useReturnToRoomHandler";
import { AnimatePresence, motion } from "framer-motion";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import useResetDeckFromCardDraw from "../../hooks/useResetDeckFromCardDraw";
import ResetRoundModal from "../modals/ResetRoundModal";
import useManuallyResetRound from "../../hooks/useManuallyResetRound";
import useScoreboardData from "../../hooks/useScoreboardData";
import OtherPlayerIcons from "./OtherPlayerIcons";
import classes from "./Play.module.css";

function Play() {
  const userID = useUserIDContext();
  const {
    roomConfig,
    gameData,
    playerMetadata,
    setGameData,
    showScoreboard,
    setShowShufflingCountdown,
    showShufflingCountdown,
    showResetRoundModal,
  } = useRoomContext();

  const [initialEffectRan, setInitialEffectRan] = useState<boolean>(false);

  useStartAnotherRoundHandler();
  useReturnToRoomHandler();
  useResetDeckFromCardDraw();
  useManuallyResetRound();
  useScoreboardData();

  useEffect(() => {
    if (initialEffectRan) return;

    setInitialEffectRan(true);
    setShowShufflingCountdown(true);

    socket.emit("modifyFriendData", {
      action: "startGame",
      initiatorID: userID,
    });
  }, [
    initialEffectRan,
    gameData,
    roomConfig.code,
    setGameData,
    setShowShufflingCountdown,
    userID,
    playerMetadata,
  ]);

  return (
    <motion.div
      key={"play"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div
        id={"playContainer"}
        className={`${classes.fullBoardGrid} relative z-[150]`}
      >
        <Board boardClass={classes.board} />

        <OtherPlayersCardContainers
          orderedClassNames={[
            classes.topPlayerCards,
            classes.leftPlayerCards,
            classes.rightPlayerCards,
          ]}
        />

        <PlayerCardContainer cardContainerClass={classes.currentPlayerCards} />
      </div>

      <OtherPlayerIcons />

      <AnimatePresence mode={"wait"}>
        {showShufflingCountdown && <ShufflingCountdownModal />}
      </AnimatePresence>

      <AnimatePresence mode={"wait"}>
        {showResetRoundModal && <ResetRoundModal />}
      </AnimatePresence>

      <AnimatePresence mode={"wait"}>
        {showScoreboard && <Scoreboard />}
      </AnimatePresence>
    </motion.div>
  );
}

export default Play;
