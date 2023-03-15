import { useEffect, useState } from "react";
import { socket } from "../../pages/";
import { useRoomContext } from "../../context/RoomContext";
import Card from "../Play/Card";
import AnimatedNumber from "react-awesome-animated-number";
import { useUserIDContext } from "../../context/UserIDContext";
import { motion } from "framer-motion";

function ShufflingCountdownModal() {
  const {
    roomConfig,
    gameData,
    playerMetadata,
    showShufflingCountdown,
    playerIDToStartNextRound,
    setPlayerIDToStartNextRound,
    setShowShufflingCountdown,
  } = useRoomContext();
  const userID = useUserIDContext();

  const [timersInitiated, setTimersInitiated] = useState<boolean>(false);
  const [countdownTimerValue, setCountdownTimerValue] = useState<number>(5); //3

  useEffect(() => {
    if (timersInitiated || !showShufflingCountdown || !gameData.currentRound)
      return;

    if (gameData.currentRound !== 1 && playerIDToStartNextRound === userID) {
      socket.emit("startGame", {
        roomCode: roomConfig.code,
        firstRound: false,
      });
      setPlayerIDToStartNextRound(null);
    }

    setTimeout(() => {
      setTimersInitiated(true);
    }, 150);

    setTimeout(() => {
      setCountdownTimerValue(4);
    }, 1000);

    setTimeout(() => {
      setCountdownTimerValue(3);
    }, 2000);

    setTimeout(() => {
      setCountdownTimerValue(2);
    }, 3000);

    setTimeout(() => {
      setCountdownTimerValue(1);
    }, 4000);

    setTimeout(() => {
      setShowShufflingCountdown(false);
      setTimersInitiated(false);
    }, 5000); // test if this delay feels okay
  }, [
    gameData.currentRound,
    roomConfig.code,
    userID,
    timersInitiated,
    showShufflingCountdown,
    playerIDToStartNextRound,
    setPlayerIDToStartNextRound,
    setShowShufflingCountdown,
  ]);

  return (
    <motion.div
      key={"shufflingCountdownModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="baseFlex absolute top-0 left-0 z-[999] h-full w-full bg-black bg-opacity-60 transition-all"
    >
      <motion.div
        key={"shufflingCountdownModalInner"}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.15, delay: 0.2 }}
        style={{
          backgroundColor: "hsl(120deg, 100%, 86%)",
          color: "hsl(120deg, 100%, 18%)",
        }}
        className="h-fit w-fit rounded-md p-8 pl-16 pr-16 font-medium shadow-md"
      >
        <div className="baseVertFlex gap-8">
          <div className="text-xl">Shuffling decks</div>

          <div className="relative mt-16 h-[64px] w-[48px] tall:h-[87px] tall:w-[67px]">
            <div className="absolute top-0 left-0 h-full w-full">
              <Card
                showCardBack={true}
                draggable={false}
                rotation={0}
                hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
                ownerID={userID}
              />
            </div>
            <div
              style={{
                animationPlayState: timersInitiated ? "running" : "paused",
              }}
              className={`topBackFacingCardInDeck absolute top-0 left-0 h-full w-full`}
            >
              <Card
                showCardBack={true}
                draggable={false}
                rotation={0}
                hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
                ownerID={userID}
              />
            </div>
          </div>

          <div className="baseFlex gap-2">
            <div>Round will begin in:</div>

            <AnimatedNumber
              value={countdownTimerValue}
              // needed because by default <AnimatedNumber /> will try to count up from 0
              // but from the moment this component is rendered, we don't want to show any
              // counting up, just the countdown.
              duration={timersInitiated ? 1000 : 0}
              color={"hsl(120deg, 100%, 18%)"}
              size={20}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ShufflingCountdownModal;
