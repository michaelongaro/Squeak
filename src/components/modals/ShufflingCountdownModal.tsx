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
    showShufflingCountdown,
    setShowShufflingCountdown,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const [timersInitiated, setTimersInitiated] = useState<boolean>(false);
  const [countdownTimerValue, setCountdownTimerValue] = useState<number>(3);

  useEffect(() => {
    if (timersInitiated || !showShufflingCountdown || !gameData.currentRound)
      return;

    setTimersInitiated(true);

    // timers are offset by 500ms to allow for the animation to play out
    setTimeout(() => {
      setCountdownTimerValue(2);
    }, 1000);

    setTimeout(() => {
      setCountdownTimerValue(1);
    }, 2000);

    if (gameData.currentRound !== 1) {
      setTimeout(() => {
        socket.emit("startGame", {
          roomCode: roomConfig.code,
          firstRound: gameData.currentRound === 1,
        });
      }, 3000);
    }

    setTimeout(() => {
      setShowShufflingCountdown(false);
      setTimersInitiated(false);
    }, 3250); // full 4000ms delay felt too long
  }, [
    gameData.currentRound,
    roomConfig.code,
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
      transition={{ duration: 0.15 }}
      className="baseFlex absolute top-0 left-0 z-[999] h-full w-full bg-black bg-opacity-60 transition-all"
    >
      <div className="h-fit w-fit rounded-md bg-green-200 p-8 pl-16 pr-16 shadow-md">
        <div className="baseVertFlex gap-6">
          <div className="text-xl">Shuffling decks</div>

          <div className="relative mt-16 h-[64px] w-[48px] tall:h-[87px] tall:w-[67px]">
            <div className="absolute top-0 left-0 h-full w-full">
              <Card
                showCardBack={true}
                draggable={false}
                rotation={0}
                ownerID={userID}
              />
            </div>
            <div
              style={{
                animationPlayState: "running",
              }}
              className={`topBackFacingCardInDeck absolute top-0 left-0 h-full w-full`}
            >
              <Card
                showCardBack={true}
                draggable={false}
                rotation={0}
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
              hasComma={true}
              size={20}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ShufflingCountdownModal;
