import { useState, useEffect, useRef } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { socket } from "../../pages";
import { motion } from "framer-motion";
import Image from "next/image";
import baseplate from "../../../public/buzzer/baseplate.png";
import squeakBuzzer from "../../../public/buzzer/buzzerButton.png";
interface IBuzzer {
  playerID: string;
  roomCode: string;
  interactive: boolean;
}

function Buzzer({ playerID, roomCode, interactive }: IBuzzer) {
  const { currentVolume, playerMetadata, playerIDWhoSqueaked } =
    useRoomContext();

  const userID = useUserIDContext();

  const [hoveringOnButton, setHoveringOnButton] = useState<boolean>(false);
  const [mouseDownOnButton, setMouseDownOnButton] = useState<boolean>(false);

  const [playExpandingPulseWaveAnimation, setPlayExpandingPulseWaveAnimation] =
    useState<boolean>(false);

  const squeakButtonAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (playerIDWhoSqueaked !== playerID) return;

    if (playerIDWhoSqueaked !== userID) {
      // simulating a mouse click on the button to trigger the animation
      setMouseDownOnButton(true);
      setTimeout(() => {
        setMouseDownOnButton(false);
      }, 150);
    }

    if (squeakButtonAudioRef.current) {
      squeakButtonAudioRef.current.volume = currentVolume * 0.01;
      squeakButtonAudioRef.current.play();
    }

    // temporarily hiding overflow on <Page /> so that the expanding pulse wave
    // animation doesn't cause the page to scroll
    const pageContainer = document.getElementById("playContainer");

    if (pageContainer) {
      pageContainer.style.overflow = "hidden";
    }

    setPlayExpandingPulseWaveAnimation(true);

    setTimeout(() => {
      setPlayExpandingPulseWaveAnimation(false);
      if (pageContainer) {
        pageContainer.style.overflow = "auto";
      }
    }, 1000);
  }, [playerIDWhoSqueaked, playerID, currentVolume, userID]);

  return (
    <motion.div
      key={`${playerID}Buzzer`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        boxShadow: hoveringOnButton
          ? "0px 0px 10px 3px rgba(184,184,184,1)"
          : "none",
        cursor: interactive ? "pointer" : "default",
      }}
      className="relative z-[999] h-[40px] w-[75px] rounded-[50%] transition-all"
      onMouseEnter={() => {
        if (interactive) setHoveringOnButton(true);
      }}
      onMouseLeave={() => {
        if (interactive) {
          setHoveringOnButton(false);
          setMouseDownOnButton(false);
        }
      }}
      onMouseDown={() => {
        if (interactive) setMouseDownOnButton(true);
      }}
      onMouseUp={() => {
        if (interactive) setMouseDownOnButton(false);
      }}
      onClick={() => {
        if (interactive) {
          socket.emit("roundOver", {
            roundWinnerID: playerID,
            roomCode,
          });
        }
      }}
    >
      <audio ref={squeakButtonAudioRef} src="/sounds/squeakButtonPress.mp3" />

      {/* grey baseplate for button */}
      <div className="absolute top-0 left-0 z-[998]">
        <Image
          draggable={false}
          src={baseplate}
          alt="baseplate for buzzer"
          className="h-[40px] w-[75px]"
        />
      </div>

      {/* actual button container */}
      <div className="absolute left-[12px] top-[-5px] z-[998] h-[35px] w-[50px]">
        <Image
          style={{
            top: mouseDownOnButton ? "8px" : "0px",
            transform: mouseDownOnButton ? "rotateX(60deg)" : "rotateX(0deg)",
          }}
          draggable={false}
          src={squeakBuzzer}
          alt="buzzer"
          className="absolute h-[35px] w-[50px] transition-all"
        />
      </div>

      <div
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          height: playExpandingPulseWaveAnimation ? "500px" : "0",
          width: playExpandingPulseWaveAnimation ? "500px" : "0",
          backgroundColor: playerMetadata[playerIDWhoSqueaked!]?.color,
          opacity: playExpandingPulseWaveAnimation ? "0.5" : "0",
          transition: playExpandingPulseWaveAnimation
            ? "all 1s linear"
            : "all 0.25s linear",
        }}
        className="absolute z-[999] rounded-[50%]"
      ></div>
    </motion.div>
  );
}

export default Buzzer;
