import { useState, useEffect, useRef } from "react";
import AnimatedCardContainer from "./AnimatedCardContainer";
import AnimatedNumber from "react-awesome-animated-number";
import confetti from "canvas-confetti";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useRoomContext } from "../../../context/RoomContext";
import PlayerIcon from "../../playerIcons/PlayerIcon";
import confettiCannon from "../../../../public/scoreboard/confettiCannon.svg";

interface IRanking {
  [key: number]: string;
}

const ranking: IRanking = {
  1: "🥇 1st",
  2: "🥈 2nd",
  3: "🥉 3rd",
  4: "4th",
};

interface IPlayerColorVariants {
  [userID: string]: {
    baseColor: string;
    pointsBackgroundColor: string;
    textColor: string;
    animatedCardsBackgroundColor: string;
  };
}

function Scoreboard() {
  const { playerMetadata, currentVolume, scoreboardMetadata } =
    useRoomContext();

  const [showNewRankings, setShowNewRankings] = useState<boolean>(false);
  const [showWinningPlayerMessage, setShowWinningPlayerMessage] =
    useState<boolean>(false);
  const [showCountdownTimer, setShowCountdownTimer] = useState<boolean>(false);

  const [animateCardsPlayedValue, setAnimateCardsPlayedValue] =
    useState<boolean>(false);
  const [animateSqueakModifierValue, setAnimateSqueakModifierValue] =
    useState<boolean>(false);
  const [animateTotalValue, setAnimateTotalValue] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const [countdownTimerValue, setCountdownTimerValue] = useState<number>(3);

  const [playerColorVariants, setPlayerColorVariants] =
    useState<IPlayerColorVariants>({});

  const confettiPopRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setAnimateCardsPlayedValue(true);
    }, 1000);

    setTimeout(() => {
      setAnimateSqueakModifierValue(true);
    }, 2500);

    setTimeout(() => {
      setAnimateTotalValue(true);
    }, 4000);

    setTimeout(() => {
      setShowNewRankings(true);
    }, 4000);

    setTimeout(() => {
      setShowWinningPlayerMessage(true);
    }, 6000);

    setTimeout(() => {
      setShowConfetti(true);

      if (confettiPopRef.current) {
        confettiPopRef.current.volume = currentVolume * 0.01;
        confettiPopRef.current.pause();
        confettiPopRef.current.currentTime = 0.35;
        confettiPopRef.current.play();
      }

      confetti(
        Object.assign(
          {},
          { origin: { x: 0.39, y: 0.72 } },
          {
            spread: 26,
            startVelocity: 35,
            angle: 135,
            zIndex: 999,
          },
          {
            particleCount: 100,
          }
        )
      );

      confetti(
        Object.assign(
          {},
          { origin: { x: 0.6, y: 0.72 } },
          {
            spread: 26,
            startVelocity: 35,
            angle: 45,
            zIndex: 999,
          },
          {
            particleCount: 100,
          }
        )
      );
    }, 6500);

    setTimeout(() => {
      setShowCountdownTimer(true);

      setTimeout(() => {
        setCountdownTimerValue(2);
      }, 1000);

      setTimeout(() => {
        setCountdownTimerValue(1);
      }, 2000);
    }, 9000);
  }, [currentVolume]);

  useEffect(() => {
    if (Object.keys(playerColorVariants).length !== 0) return;

    const newPlayerColorVariants: IPlayerColorVariants = {};

    for (const userID in playerMetadata) {
      const hslColor = playerMetadata[userID]?.color;

      if (!hslColor) return;

      const strippedHSLColor = hslColor.slice(0, -4);
      const lightness = parseInt(
        hslColor.slice(hslColor.length - 4, hslColor.length).trim()
      );

      newPlayerColorVariants[userID] = {
        baseColor: hslColor,
        pointsBackgroundColor:
          strippedHSLColor + `${Math.floor(lightness * 0.75)}%)`,
        textColor: strippedHSLColor + `${Math.floor(lightness * 1.5)}%)`,
        animatedCardsBackgroundColor: strippedHSLColor + "90%)",
      };
    }

    setPlayerColorVariants(newPlayerColorVariants);
  }, [playerMetadata, playerColorVariants]);

  return (
    <motion.div
      key={"scoreboardModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="baseFlex absolute top-0 left-0 z-[999] h-full w-full bg-black bg-opacity-60 transition-all"
    >
      <audio ref={confettiPopRef} src="/sounds/confettiPop.wav" />
      <motion.div
        key={"scoreboardModalInner"}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.15, delay: 0.35 }}
        style={{
          color: "hsl(120deg 100% 86%)",
          backgroundColor: "hsl(120deg 100% 18%)",
          borderColor: "hsl(120deg 100% 86%)",
        }}
        className="h-[95%] w-[95%] rounded-lg border-2 p-4 shadow-md tall:h-[75%] tall:w-[75%]"
      >
        {scoreboardMetadata?.playerRoundDetails && (
          <div className="baseVertFlex h-full gap-2 tall:gap-12">
            <div className="text-2xl">Scoreboard</div>

            <div className="baseFlex h-full w-full gap-4">
              {Object.values(scoreboardMetadata.playerRoundDetails).map(
                (player) => (
                  <div
                    key={player.playerID}
                    className="baseVertFlex h-full w-full shadow-md"
                  >
                    {/* avatar + username */}
                    <div
                      style={{
                        backgroundColor:
                          playerColorVariants[player.playerID]?.baseColor ??
                          "white",
                      }}
                      className="baseVertFlex h-36 w-full gap-2 rounded-t-md pt-2 font-semibold"
                    >
                      <PlayerIcon
                        avatarPath={
                          playerMetadata[player.playerID]?.avatarPath ??
                          "/avatars/rabbit.svg"
                        }
                        borderColor={
                          playerMetadata[player.playerID]?.color ??
                          "hsl(352deg, 69%, 61%)"
                        }
                        size={"3rem"}
                      />
                      <div
                        style={{
                          color:
                            playerColorVariants[player.playerID]?.textColor ??
                            "black",
                        }}
                      >
                        {playerMetadata[player.playerID]?.username}
                      </div>
                    </div>

                    {/* anim. scores + cards */}
                    <div
                      style={{
                        backgroundColor:
                          playerColorVariants[player.playerID]
                            ?.animatedCardsBackgroundColor ?? "white",
                        color:
                          playerColorVariants[player.playerID]?.textColor ??
                          "black",
                      }}
                      className="relative z-[1] h-full w-full overflow-hidden"
                    >
                      {/* ideally some kind of glassmorphism  */}
                      <div
                        style={{
                          backgroundColor:
                            playerColorVariants[player.playerID]
                              ?.pointsBackgroundColor ?? "white",
                        }}
                        className="baseVertFlex absolute top-0 left-0 z-[3] w-full bg-black bg-opacity-30 p-2"
                      >
                        <div className="align-center flex w-full justify-between pl-8 pr-8 text-lg ">
                          Cards played
                          <div className="baseFlex">
                            <div
                              style={{
                                opacity: animateCardsPlayedValue ? 1 : 0,
                              }}
                              className="transition-opacity"
                            >
                              +
                            </div>
                            <AnimatedNumber
                              value={
                                animateCardsPlayedValue
                                  ? player.cardsPlayed.length
                                  : 0
                              }
                              duration={animateCardsPlayedValue ? 1000 : 0}
                              order={"asc"}
                              size={18}
                            />
                          </div>
                        </div>
                        {/* make this red/green text */}
                        <div className="align-center flex w-full justify-between pl-8 pr-8 text-lg">
                          Squeak
                          <div className="baseFlex">
                            <div
                              style={{
                                opacity: animateSqueakModifierValue ? 1 : 0,
                              }}
                              className="transition-opacity"
                            >
                              {player.squeakModifier > 0 ? "+" : ""}
                            </div>
                            <AnimatedNumber
                              value={
                                animateSqueakModifierValue
                                  ? player.squeakModifier
                                  : 0
                              }
                              duration={animateSqueakModifierValue ? 1000 : 0}
                              order={player.squeakModifier > 0 ? "asc" : "desc"}
                              size={18}
                            />
                          </div>
                        </div>
                        <div className="align-center flex w-full justify-between pl-8 pr-8 text-xl">
                          Total
                          <AnimatedNumber
                            value={
                              animateTotalValue
                                ? player.newScore
                                : player.oldScore
                            }
                            duration={animateTotalValue ? 1000 : 0}
                            order={
                              player.newScore > player.oldScore ? "asc" : "desc"
                            }
                            size={22}
                          />
                        </div>
                      </div>

                      <AnimatedCardContainer
                        cards={player.cardsPlayed}
                        playerID={player.playerID}
                      />
                    </div>

                    {/* ranking */}
                    <div
                      style={{
                        backgroundColor:
                          playerColorVariants[player.playerID]?.baseColor ??
                          "white",
                        color:
                          playerColorVariants[player.playerID]?.textColor ??
                          "black",
                      }}
                      className="grid w-full grid-cols-1 items-center justify-items-center gap-2 rounded-b-md p-2"
                    >
                      <AnimatePresence mode={"wait"}>
                        {showNewRankings && (
                          <motion.div
                            key={`newRanking${player.playerID}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="col-start-1 row-start-1 font-semibold"
                          >
                            {ranking[player.newRanking]}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <AnimatePresence mode={"wait"}>
                        {!showNewRankings && (
                          <motion.div
                            key={`oldRanking${player.playerID}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="col-start-1 row-start-1 font-semibold"
                          >
                            {ranking[player.oldRanking] ?? "-"}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* player who won banner */}
            <div
              style={{
                opacity: showWinningPlayerMessage ? 1 : 0,
                pointerEvents: showWinningPlayerMessage ? "auto" : "none",
                backgroundColor:
                  playerColorVariants[
                    scoreboardMetadata.gameWinnerID ??
                      scoreboardMetadata.roundWinnerID
                  ]?.baseColor ?? "black",
              }}
              className="baseFlex gap-4 rounded-md p-4 transition-all"
            >
              {/* left confetti cannon */}
              <Image
                style={{
                  opacity: showConfetti ? 1 : 0,
                  transform: showConfetti
                    ? "scale(1) rotate(135deg)"
                    : "scale(0) rotate(135deg)",
                  filter: "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                }}
                className="h-8 w-8 transition-all"
                src={confettiCannon}
                alt={"left celebratory confetti cannon"}
              />

              <PlayerIcon
                avatarPath={
                  playerMetadata[
                    scoreboardMetadata.gameWinnerID ??
                      scoreboardMetadata.roundWinnerID
                  ]?.avatarPath ?? "/avatars/rabbit.svg"
                }
                borderColor={
                  playerMetadata[
                    scoreboardMetadata.gameWinnerID ??
                      scoreboardMetadata.roundWinnerID
                  ]?.color ?? "hsl(352deg, 69%, 61%)"
                }
                size={"3rem"}
              />
              <div
                style={{
                  color:
                    playerColorVariants[
                      scoreboardMetadata.gameWinnerID ??
                        scoreboardMetadata.roundWinnerID
                    ]?.textColor ?? "black",
                }}
                className="text-xl"
              >
                {scoreboardMetadata.gameWinnerID
                  ? playerMetadata[scoreboardMetadata.gameWinnerID]?.username
                  : playerMetadata[scoreboardMetadata.roundWinnerID]?.username}
                {` won the ${
                  scoreboardMetadata.gameWinnerID ? "game" : "round"
                }!`}
              </div>

              {/* right confetti cannon */}
              <Image
                style={{
                  opacity: showConfetti ? 1 : 0,
                  transform: showConfetti
                    ? "scale(1) rotate(225deg)"
                    : "scale(0) rotate(225deg)",
                  filter: "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                }}
                className="h-8 w-8 transition-all"
                src={confettiCannon}
                alt={"right celebratory confetti cannon"}
              />
            </div>

            <div
              style={{
                opacity: showCountdownTimer ? 1 : 0,
                pointerEvents: showCountdownTimer ? "auto" : "none",
              }}
              className="baseFlex gap-2 text-lg transition-all"
            >
              <div>
                {scoreboardMetadata.gameWinnerID
                  ? "Returning to room in:"
                  : "Next round starts in:"}
              </div>

              <AnimatedNumber
                value={countdownTimerValue}
                duration={1000}
                order={"desc"}
                size={20}
              />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Scoreboard;
