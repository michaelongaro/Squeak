import { useEffect, useState } from "react";
import { socket } from "../../pages/";
import { useRoomContext } from "../../context/RoomContext";
import Card from "../Play/Card";
import AnimatedNumber from "react-awesome-animated-number";
import { useUserIDContext } from "../../context/UserIDContext";

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
    }, 1500);

    setTimeout(() => {
      setCountdownTimerValue(1);
    }, 2500);

    if (gameData.currentRound !== 1) {
      setTimeout(() => {
        console.log(
          "started game from shuffle, currentRound is",
          gameData.currentRound
        );

        socket.emit("startGame", {
          roomCode: roomConfig.code,
          firstRound: gameData.currentRound === 1,
        });
      }, 3500);
    }

    setTimeout(() => {
      setShowShufflingCountdown(false);
      setTimersInitiated(false);
    }, 4000);
  }, [
    gameData.currentRound,
    roomConfig.code,
    timersInitiated,
    showShufflingCountdown,
    setShowShufflingCountdown,
  ]);

  return (
    <div
      style={{
        // prob move this to motion.div and have show && (component) with AnimatePresence handle
        // need for opacity and then pointerEvents won't be necessary because it won't be rendered
        opacity: showShufflingCountdown ? 1 : 0,
        pointerEvents: showShufflingCountdown ? "auto" : "none",
      }}
      className="baseFlex absolute top-0 left-0 z-[999] h-full w-full bg-black bg-opacity-60 transition-all"
    >
      {/* prob will run into issues and will need framer motion to smoothly animate in/out */}
      {showShufflingCountdown && (
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
                duration={1500}
                hasComma={true}
                size={20}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShufflingCountdownModal;
