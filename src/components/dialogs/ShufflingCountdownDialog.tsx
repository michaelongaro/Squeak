import { useEffect, useRef, useState } from "react";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "../Play/Card";
import { motion, useAnimation } from "framer-motion";
import AnimatedNumbers from "~/components/ui/AnimatedNumbers";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";

const deck = Array.from({ length: 15 }, () => ({ suit: "S", value: "2" }));
const repeatCount = 2;
const delayBetweenIterations = 1000;

function ShufflingCountdownDialog() {
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
    <DialogContent className="z-[500] w-80 rounded-lg border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 px-16 py-8 font-medium text-lightGreen shadow-md sm:w-96">
      <VisuallyHidden>
        <DialogTitle>
          Shuffling deck for round {gameData.currentRound}
        </DialogTitle>
        <DialogDescription>
          The decks are being shuffled for the upcoming round
        </DialogDescription>
      </VisuallyHidden>

      <div className="baseVertFlex gap-8">
        <div className="baseVertFlex gap-2">
          <div className="text-xl">Round {gameData.currentRound}</div>
          <div className="text-lightGreen/75">Shuffling decks</div>
        </div>

        <div
          style={{
            perspective: "450px",
            transformStyle: "preserve-3d",
          }}
          className="z-[2] mt-4 h-[115px] w-full tablet:h-[165px]"
        >
          {deck.map((card, index) => (
            <AnimatedShufflingCard
              key={`animatedShufflingCard${index}`}
              index={index + 1} // seems to fix bug where the first card skipped animation entirely
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
    </DialogContent>
  );
}

export default ShufflingCountdownDialog;

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
  const isMountedRef = useRef(true);

  // trying to be extra cautious with cleanup here since a client side error
  // would obviously not be tolerable during a real game.

  // also the + 0.01 is a hacky fix to get the animation to still work (maybe delays could
  // have been used instead) since framer motion doesn't seem to play the animation if the
  // property value is the same as the previous one.

  useEffect(() => {
    async function startAnimationSequence() {
      if (!isMountedRef.current) return;

      await controls.start({
        top: topPosition,
        opacity: 1,
        x: "-50%",
        rotateX: 25,
        rotateZ: 50,
        transition: { duration: 1, ease: "easeInOut" },
      });

      for (let i = 0; i < repeatCount; i++) {
        if (!isMountedRef.current) return;

        if (index < halfDeckLength) {
          // Top half of the deck
          await controls.start({
            x: 75, // Move the top half to the right
            y: topPosition / 10,
            transition: {
              duration: 0.5,
              ease: "easeInOut",
            },
          });
          if (!isMountedRef.current) return;
          await controls.start({
            x: 75, // Move the top half to the right
            y: topPosition * 2, // Fan out vertically
            transition: {
              duration: 0.5,
              ease: "easeInOut",
            },
          });
          if (!isMountedRef.current) return;
          await controls.start({
            x: "-50%",
            y: topPosition * 2,
            transition: {
              duration: 0.35,
              ease: "easeInOut",
            },
          });
          if (!isMountedRef.current) return;
          await controls.start({
            x: "-50%",
            y: topPosition / 10 + 0.01, // necessary?
            transition: { duration: 0.5, ease: "easeInOut" },
          });
        } else {
          // Bottom half of the deck
          if (!isMountedRef.current) return;
          await controls.start({
            y: topPosition / 10,
            transition: { duration: 0.5, ease: "easeInOut" },
          });
          if (!isMountedRef.current) return;
          await controls.start({
            y: topPosition * 1.75 - 40,
            transition: { duration: 0.5, ease: "easeInOut" },
          });
          if (!isMountedRef.current) return;
          await controls.start({
            y: topPosition * 1.75 - 40.01,
            transition: { duration: 0.35, ease: "easeInOut" },
          });
          if (!isMountedRef.current) return;
          await controls.start({
            x: "-50%",
            y: topPosition / 10 + 0.01,
            transition: { duration: 0.5, ease: "easeInOut" },
          });
        }

        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenIterations),
        ); // Adding delay between iterations
      }
    }

    startAnimationSequence();

    return () => {
      isMountedRef.current = false;
      controls.stop();
    };
  }, [controls, index, topPosition, halfDeckLength]);

  return (
    <motion.div
      initial={{ top: 0, opacity: 0 }}
      animate={controls}
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%) rotateX(25deg) rotateZ(50deg)",
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
