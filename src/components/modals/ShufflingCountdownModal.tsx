import { useEffect, useState } from "react";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "../Play/Card";
import { motion, useAnimation } from "framer-motion";
import AnimatedNumbers from "~/components/ui/AnimatedNumbers";

const deck = Array.from({ length: 15 }, () => ({ suit: "S", value: "2" }));
const repeatCount = 2; // Specify the number of times to repeat the animation
const delayBetweenIterations = 1500; // Delay in milliseconds between each iteration

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

    setTimeout(() => setTimersInitiated(true), 500);
    setTimeout(() => setCountdownTimerValue(4), 1500);
    setTimeout(() => setCountdownTimerValue(3), 2500);
    setTimeout(() => setCountdownTimerValue(2), 3500);
    setTimeout(() => setCountdownTimerValue(1), 4500);
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
        className="h-fit w-fit rounded-lg border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 px-16 py-8 font-medium text-lightGreen shadow-md"
      >
        <div className="baseVertFlex gap-8">
          <div className="baseVertFlex gap-2">
            <div className="text-xl">Round {gameData.currentRound}</div>
            <div className="text-lightGreen/75">Shuffling decks</div>
          </div>

          {/* <div className="cardDimensions relative mt-16 select-none rounded-[0.25rem] desktop:mt-20">
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
          </div> */}

          <div
            style={{
              perspective: "450px",
              transformStyle: "preserve-3d",
            }}
            className="z-[2] h-[115px] w-full tablet:h-[165px]"
          >
            {deck.map((card, index) => (
              <AnimatedShufflingCard
                key={`animatedShufflingCard${index}`}
                index={index}
                hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
              />
            ))}
          </div>

          <div className="baseFlex gap-2">
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

function AnimatedShufflingCard({
  index,
  hueRotation,
}: {
  index: number;
  hueRotation: number;
}) {
  const controls = useAnimation();
  const topPosition = index * 2; // Ensuring each card gets a unique initial top position
  const halfDeckLength = Math.floor(deck.length / 2);

  useEffect(() => {
    async function startAnimationSequence() {
      for (let i = 0; i < repeatCount; i++) {
        await controls.start({
          top: topPosition,
          opacity: 1,
          x: "-50%",
          rotateX: 25,
          rotateZ: 50,
          transition: { duration: 0.5, ease: "easeInOut" },
        });

        if (index < halfDeckLength) {
          // Top half of the deck
          await controls.start({
            x: 75, // Move the top half to the right
            y: topPosition + index * 3, // Fan out vertically
            transition: { duration: 0.5, ease: "easeInOut" },
          });
        } else {
          // Bottom half of the deck
          await controls.start({
            y: topPosition - (index - halfDeckLength) * 3 - 20, // Move the bottom half up and fan out vertically
            transition: { duration: 0.5, ease: "easeInOut" },
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay before moving back

        if (index < halfDeckLength) {
          // Move the top half back to the center
          await controls.start({
            x: "-50%",
            y: topPosition * 4,
            transition: { duration: 0.5, ease: "easeInOut" },
          });
        } else {
          // Move the bottom half back to the center
          await controls.start({
            y: topPosition,
            transition: { duration: 0.5, ease: "easeInOut" },
          });
        }

        if (index < halfDeckLength) {
          // Move the top half back to the center
          await controls.start({
            x: "-50%",
            y: topPosition,
            transition: { duration: 0.5, ease: "easeInOut" },
          });
        } else {
          // Move the bottom half back to the center
          await controls.start({
            y: topPosition,
            transition: { duration: 0.5, ease: "easeInOut" },
          });
        }

        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenIterations),
        ); // Adding delay between iterations
      }
    }

    startAnimationSequence();
  }, [controls, index, topPosition, halfDeckLength]);

  return (
    <motion.div
      initial={{ top: 0, opacity: 0 }}
      animate={controls}
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%) rotateX(25deg) rotateZ(50deg)",
        zIndex: deck.length - index, // to maintain stack order
      }}
      id={`animatedShufflingCard${index}`}
    >
      <Card
        value={"2"}
        suit={"S"}
        draggable={false}
        showCardBack={true}
        hueRotation={hueRotation}
        rotation={0}
      />
    </motion.div>
  );
}
