import {
  AnimatePresence,
  motion,
  type MotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";

function calculateDelay(place: number) {
  const baseDelay = 0.2; // Base delay in seconds
  const delayIncrement = 0.05; // Increment delay in seconds

  switch (place) {
    case 10000:
      return baseDelay;
    case 1000:
      return baseDelay + delayIncrement;
    case 100:
      return baseDelay + delayIncrement * 2;
    case 10:
      return baseDelay + delayIncrement * 3;
    case 1:
    default:
      return baseDelay + delayIncrement * 4;
  }
}

interface AnimatedNumbers {
  value: number;
  fontSize?: number;
  padding?: number;
}

function AnimatedNumbers({
  value,
  fontSize = 30,
  padding = 15,
}: AnimatedNumbers) {
  const height = fontSize + padding;
  const absValue = Math.abs(value);
  const isNegative = value < 0;

  return (
    <div
      style={{ fontSize }}
      className="flex space-x-0 overflow-hidden rounded"
    >
      {isNegative && (
        <motion.div
          key="negative-sign"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "1ch" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-[1ch]"
        >
          -
        </motion.div>
      )}
      <AnimatePresence>
        {absValue > 9999 && (
          <Digit key="10000" place={10000} value={absValue} height={height} />
        )}
        {absValue > 999 && (
          <Digit key="1000" place={1000} value={absValue} height={height} />
        )}
        {absValue > 99 && (
          <Digit key="100" place={100} value={absValue} height={height} />
        )}
        {absValue > 9 && (
          <Digit key="10" place={10} value={absValue} height={height} />
        )}
        <Digit key="1" place={1} value={absValue} height={height} />
      </AnimatePresence>
    </div>
  );
}

export default AnimatedNumbers;

function Digit({
  place,
  value,
  height,
}: {
  place: number;
  value: number;
  height: number;
}) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace, {
    stiffness: 100,
    damping: 20,
    mass: 1,
  });

  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    // Delay initiation based on place value
    const delay = calculateDelay(place);
    const timeoutId = setTimeout(() => {
      setStartAnimation(true);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [place]);

  useEffect(() => {
    if (startAnimation) {
      animatedValue.set(Math.floor(value / place));
    }
  }, [startAnimation, value, place, animatedValue]);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <motion.div
      key={place}
      style={{ height }}
      initial={{ opacity: 0, width: 0 }}
      animate={{ opacity: 1, width: "1ch" }}
      exit={{ opacity: 0, width: 0 }}
      transition={{ duration: 0.2 }}
      className="relative w-[1ch]"
    >
      {[...Array(10).keys()].map((i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </motion.div>
  );
}

function Number({
  mv,
  number,
  height,
}: {
  mv: MotionValue;
  number: number;
  height: number;
}) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;

    let memo = offset * height;

    if (offset > 5) {
      memo -= 10 * height;
    }

    return memo;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}
