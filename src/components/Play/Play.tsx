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
import { motion } from "framer-motion";

import classes from "./Play.module.css";

function Play() {
  const { gameData, roomConfig, setGameData, setShowShufflingCountdown } =
    useRoomContext();

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

    // maybe you need to have a disconnect function that runs
    // when the component unmounts?
  }, [gameData, roomConfig.code, setGameData, setShowShufflingCountdown]);

  return (
    <motion.div
      key={"play"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className={`${classes.fullBoardGrid} relative `}>
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

      <ShufflingCountdownModal />

      <Scoreboard />
    </motion.div>
  );
}

export default Play;
