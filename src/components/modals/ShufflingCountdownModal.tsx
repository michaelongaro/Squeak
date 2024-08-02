import { useEffect, useState } from "react";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "../Play/Card";
import { motion } from "framer-motion";
import AnimatedNumbers from "~/components/ui/AnimatedNumbers";

function ShufflingCountdownModal() {
  const userID = useUserIDContext();

  const {
    gameData,
    roomConfig,
    playerMetadata,
    setShowShufflingCountdown,
    showShufflingCountdown,
  } = useRoomContext();

  const [timersInitiated, setTimersInitiated] = useState<boolean>(false);
  const [countdownTimerValue, setCountdownTimerValue] = useState<number>(5);

  useEffect(() => {
    if (timersInitiated || !showShufflingCountdown || !gameData.currentRound)
      return;

    setTimeout(() => {
      setTimersInitiated(true);
    }, 500);

    setTimeout(() => {
      setCountdownTimerValue(4);
    }, 1500);

    setTimeout(() => {
      setCountdownTimerValue(3);
    }, 2500);

    setTimeout(() => {
      setCountdownTimerValue(2);
    }, 3500);

    setTimeout(() => {
      setCountdownTimerValue(1);
    }, 4500);

    setTimeout(() => {
      setShowShufflingCountdown(false);
      setTimersInitiated(false);
    }, 5500);
  }, [
    gameData.currentRound,
    roomConfig.code,
    userID,
    timersInitiated,
    showShufflingCountdown,
    setShowShufflingCountdown,
  ]);

  return (
    <motion.div
      key={"shufflingCountdownModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="baseFlex absolute left-0 top-0 z-[200] h-full w-full bg-black bg-opacity-60"
    >
      <motion.div
        key={"shufflingCountdownModalInner"}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.15, delay: 0.2 }}
        style={{
          backgroundColor: "hsl(120deg, 100%, 86%)",
          color: "hsl(120deg, 100%, 18%)",
        }}
        className="h-fit w-fit rounded-md px-16 py-8 font-medium shadow-md"
      >
        <div className="baseVertFlex gap-8">
          <div className="text-xl">Shuffling decks</div>

          <div className="cardDimensions relative mt-16 select-none rounded-[0.25rem] desktop:mt-20">
            <div className="absolute left-0 top-0 h-full w-full">
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
                animationIterationCount: "5",
              }}
              className={`topBackFacingCardInDeck absolute left-0 top-0 h-full w-full`}
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

          <div className="baseFlex gap-2 text-darkGreen">
            <div>Round will begin in:</div>

            <AnimatedNumbers
              value={countdownTimerValue}
              padding={2}
              fontSize={18}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ShufflingCountdownModal;
