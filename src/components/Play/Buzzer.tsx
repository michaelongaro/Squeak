import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { motion } from "framer-motion";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import baseplate from "../../../public/buzzer/baseplate.png";
import squeakBuzzer from "../../../public/buzzer/buzzerButton.png";
interface IBuzzer {
  playerID: string;
  roomCode: string;
  interactive: boolean;
}

function Buzzer({ playerID, roomCode, interactive }: IBuzzer) {
  const userID = useUserIDContext();

  const {
    audioContext,
    masterVolumeGainNode,
    squeakButtonPressBuffer,
    currentVolume,
    playerMetadata,
    playerIDWhoSqueaked,
    viewportLabel,
    showScoreboard,
  } = useRoomContext();

  const [hoveringOnButton, setHoveringOnButton] = useState<boolean>(false);
  const [pointerDownOnButton, setPointerDownOnButton] =
    useState<boolean>(false);

  const [playExpandingPulseWaveAnimation, setPlayExpandingPulseWaveAnimation] =
    useState<boolean>(false);

  useEffect(() => {
    // this effect would constantly trigger if volume was being changed while scoreboard was open
    // (although that was an edge case since the scoreboard being open should prevent volume changes)
    if (playerIDWhoSqueaked !== playerID || showScoreboard) return;

    if (playerIDWhoSqueaked !== userID) {
      // simulating a pointer click on the button to trigger the animation
      setPointerDownOnButton(true);
      setTimeout(() => {
        setPointerDownOnButton(false);
      }, 150);
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
  }, [playerIDWhoSqueaked, playerID, currentVolume, userID, showScoreboard]);

  return (
    <motion.div
      key={`${playerID}Buzzer`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.25, ease: "linear" },
        scale: {
          type: "spring",
          bounce: 0.65,
        },
      }}
      style={{
        filter: hoveringOnButton
          ? "drop-shadow(0px 0px 5px rgba(184,184,184,1))"
          : "none",
        cursor: interactive ? "pointer" : "default",
        transition: "filter 150ms ease-in-out",
        animation:
          hoveringOnButton || !interactive ? "none" : "pulse 3s infinite",
      }}
      className="relative z-[100] h-[30px] w-[50px] rounded-[50%] tablet:h-[35px] tablet:w-[57px] desktop:h-[40px] desktop:w-[65px]"
      onPointerEnter={() => {
        if (interactive) setHoveringOnButton(true);
      }}
      onPointerLeave={() => {
        if (interactive) {
          setHoveringOnButton(false);
          setPointerDownOnButton(false);
        }
      }}
      onPointerDown={() => {
        if (interactive) setPointerDownOnButton(true);
      }}
      onPointerUp={() => {
        if (interactive) setPointerDownOnButton(false);
      }}
      onClick={() => {
        if (interactive && !playExpandingPulseWaveAnimation) {
          socket.emit("roundOver", {
            playerWhoSqueakedID: playerID,
            roomCode,
          });

          if (audioContext && masterVolumeGainNode) {
            const squeakButtonPressSoundSource =
              audioContext.createBufferSource();
            squeakButtonPressSoundSource.buffer = squeakButtonPressBuffer;

            squeakButtonPressSoundSource.connect(masterVolumeGainNode);
            squeakButtonPressSoundSource.start();
          }
        }
      }}
    >
      {/* grey baseplate for button */}
      <div className="absolute left-0 top-0 z-[140]">
        <img
          draggable={false}
          src={baseplate.src}
          alt="baseplate for buzzer"
          style={{
            // fyi: I think this is just to hide other player's buzzers from spilling over onto edge of viewport on mobile
            opacity:
              playerID !== userID && viewportLabel.includes("mobile")
                ? "0"
                : "1",
          }}
          className="h-[32px] w-[50px] tablet:h-[35px] tablet:w-[57px] desktop:h-[40px] desktop:w-[75px]"
        />
      </div>

      {/* actual button container */}
      <div className="absolute left-[5px] top-[-3px] z-[140] h-[28px] w-[40px] tablet:left-[9px] tablet:top-[-3px] tablet:h-[30px] tablet:w-[40px] desktop:left-[7.5px] desktop:top-[-5px] desktop:h-[35px] desktop:w-[50px]">
        <img
          style={{
            // fyi: I think this is just to hide other player's buzzers from spilling over onto edge of viewport on mobile
            opacity:
              playerID !== userID && viewportLabel.includes("mobile")
                ? "0"
                : "1",
            top: pointerDownOnButton ? "6px" : "0px",
            transform: pointerDownOnButton ? "rotateX(50deg)" : "rotateX(0deg)",
            transitionTimingFunction: "ease-in-out",
          }}
          draggable={false}
          src={squeakBuzzer.src}
          alt="buzzer"
          className="absolute h-[28px] w-[40px] transition-all tablet:h-[30px] tablet:w-[40px] desktop:h-[35px] desktop:w-[50px]"
        />
      </div>

      <div
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          height: playExpandingPulseWaveAnimation ? "500px" : "0",
          width: playExpandingPulseWaveAnimation ? "500px" : "0",
          backgroundColor: playerMetadata[playerIDWhoSqueaked || ""]?.color,
          opacity: playExpandingPulseWaveAnimation ? "0.5" : "0",
          transition: playExpandingPulseWaveAnimation
            ? "all 1s linear"
            : "all 0.25s linear",
        }}
        className="absolute z-[150] rounded-[50%]"
      ></div>
    </motion.div>
  );
}

export default Buzzer;
