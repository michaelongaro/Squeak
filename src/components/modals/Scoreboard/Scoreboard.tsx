import { useState, useEffect, useMemo, useRef } from "react";
import { socket } from "~/pages/_app";
import AnimatedCardContainer from "./AnimatedCardContainer";
import AnimatedNumber from "react-awesome-animated-number";
import confetti from "canvas-confetti";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import PlayerIcon from "../../playerIcons/PlayerIcon";
import { FaTrophy } from "react-icons/fa6";
import confettiPopper from "../../../../public/scoreboard/confettiPopper.svg";
import { type IPlayerRoundDetails } from "../../../pages/api/handlers/roundOverHandler";
import { Button } from "~/components/ui/button";
import { useMainStore } from "~/stores/MainStore";
import useGetUserID from "~/hooks/useGetUserID";

interface IRanking {
  [key: number]: string;
}

const ranking: IRanking = {
  1: "1st",
  2: "2nd",
  3: "3rd",
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
  const userID = useGetUserID();

  const {
    audioContext,
    masterVolumeGainNode,
    confettiPopBuffer,
    playerMetadata,
    currentVolume,
    roomConfig,
    scoreboardMetadata,
    viewportLabel,
    setPlayerIDWhoSqueaked,
  } = useMainStore((state) => ({
    audioContext: state.audioContext,
    masterVolumeGainNode: state.masterVolumeGainNode,
    confettiPopBuffer: state.confettiPopBuffer,
    playerMetadata: state.playerMetadata,
    currentVolume: state.currentVolume,
    roomConfig: state.roomConfig,
    scoreboardMetadata: state.scoreboardMetadata,
    viewportLabel: state.viewportLabel,
    setPlayerIDWhoSqueaked: state.setPlayerIDWhoSqueaked,
  }));

  const [initalizedTimers, setInitalizedTimers] = useState(false);

  const [showNewRankings, setShowNewRankings] = useState<boolean>(false);
  const [showWinningPlayerMessage, setShowWinningPlayerMessage] =
    useState<boolean>(false);
  const [showHostActionButton, setShowHostActionButton] =
    useState<boolean>(false);
  // const [showCountdownTimer, setShowCountdownTimer] = useState<boolean>(false);

  const [animateCardsPlayedValue, setAnimateCardsPlayedValue] =
    useState<boolean>(false);
  const [animateSqueakModifierValue, setAnimateSqueakModifierValue] =
    useState<boolean>(false);
  const [animateTotalValue, setAnimateTotalValue] = useState<boolean>(false);
  const [showConfettiPoppers, setShowConfettiPoppers] =
    useState<boolean>(false);

  // const [countdownTimerValue, setCountdownTimerValue] = useState<number>(3);

  const [playerColorVariants, setPlayerColorVariants] =
    useState<IPlayerColorVariants>({});

  const [sortedPlayerRoundDetails, setSortedPlayerRoundDetails] = useState<
    IPlayerRoundDetails[]
  >([]);

  const leftConfettiCannonRef = useRef<HTMLImageElement>(null);
  const rightConfettiCannonRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (initalizedTimers) return;

    setInitalizedTimers(true);

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
      // set with sorted playerIDs by their newScore

      const playerRoundDetailsArray = Object.values(
        scoreboardMetadata!.playerRoundDetails,
      );

      playerRoundDetailsArray.sort((a, b) => {
        return b.newScore - a.newScore;
      });

      setSortedPlayerRoundDetails(playerRoundDetailsArray);

      setShowNewRankings(true);
    }, 4000);

    setTimeout(() => {
      setShowWinningPlayerMessage(true);
    }, 6000);

    setTimeout(() => {
      setShowConfettiPoppers(true);

      if (audioContext && masterVolumeGainNode) {
        const confettiPopBufferSource = audioContext.createBufferSource();
        confettiPopBufferSource.buffer = confettiPopBuffer;

        confettiPopBufferSource.connect(masterVolumeGainNode);
        confettiPopBufferSource.start(0, 0.35);
      }

      const leftConfettiCannonOffsets =
        leftConfettiCannonRef.current?.getBoundingClientRect() ?? {
          x: 0,
          y: 0,
        };
      const rightConfettiCannonOffsets =
        rightConfettiCannonRef.current?.getBoundingClientRect() ?? {
          x: 0,
          y: 0,
        };

      confetti(
        Object.assign(
          {},
          {
            origin: {
              x: leftConfettiCannonOffsets.x / window.innerWidth,
              y: leftConfettiCannonOffsets.y / window.innerHeight,
            },
          },
          {
            spread: 26,
            startVelocity: 35,
            angle: viewportLabel.includes("mobile") ? 45 : 135,
            zIndex: 200,
          },
          {
            particleCount: 100,
          },
        ),
      );

      confetti(
        Object.assign(
          {},
          {
            origin: {
              x: rightConfettiCannonOffsets.x / window.innerWidth,
              y: rightConfettiCannonOffsets.y / window.innerHeight,
            },
          },
          {
            spread: 26,
            startVelocity: 35,
            angle: viewportLabel.includes("mobile") ? 135 : 45,
            zIndex: 200,
          },
          {
            particleCount: 100,
          },
        ),
      );
    }, 6500);

    setTimeout(() => {
      setShowHostActionButton(true);
    }, 8500);

    // TODO: re-enable this functionality with special handler on backend that listens/propagates
    // out to other players when host has clicked to move back to lobby/start next round
    // setTimeout(() => {
    //   setShowCountdownTimer(true);

    //   setTimeout(() => {
    //     setCountdownTimerValue(2);
    //   }, 1000);

    //   setTimeout(() => {
    //     setCountdownTimerValue(1);
    //   }, 2000);
    // }, 10000);
  }, [
    initalizedTimers,
    currentVolume,
    audioContext,
    masterVolumeGainNode,
    confettiPopBuffer,
    viewportLabel,
    scoreboardMetadata,
    userID,
  ]);

  useEffect(() => {
    // set with sorted playerIDs by their oldScore
    if (
      scoreboardMetadata &&
      Object.values(scoreboardMetadata.playerRoundDetails)[0]?.oldScore !== 0
    ) {
      const playerRoundDetailsArray = Object.values(
        scoreboardMetadata.playerRoundDetails,
      );

      playerRoundDetailsArray.sort((a, b) => {
        return b.oldScore - a.oldScore;
      });

      setSortedPlayerRoundDetails(playerRoundDetailsArray);
    } else if (scoreboardMetadata) {
      setSortedPlayerRoundDetails(
        Object.values(scoreboardMetadata.playerRoundDetails),
      );
    }
  }, [scoreboardMetadata]);

  useEffect(() => {
    if (Object.keys(playerColorVariants).length !== 0) return;

    const newPlayerColorVariants: IPlayerColorVariants = {};

    for (const userID in playerMetadata) {
      const hslColor = playerMetadata[userID]?.color;

      if (!hslColor) return;

      const strippedHSLColor = hslColor.slice(0, -4);
      const lightness = parseInt(
        hslColor.slice(hslColor.length - 4, hslColor.length).trim(),
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

  const currentPlayerStats = useMemo(() => {
    if (!scoreboardMetadata?.playerRoundDetails) return;

    return scoreboardMetadata.playerRoundDetails[
      userID as keyof typeof scoreboardMetadata.playerRoundDetails
    ];
  }, [userID, scoreboardMetadata]);

  if (viewportLabel.includes("mobile")) {
    return (
      <motion.div
        key={"scoreboardModal"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="baseFlex absolute left-0 top-0 z-[200] h-full w-full bg-black bg-opacity-60"
      >
        <motion.div
          key={"scoreboardModalInner"}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          transition={{ duration: 0.15, delay: 0.35 }}
          style={{
            color: "hsl(120deg 100% 86%)",
            borderColor: "hsl(120deg 100% 86%)",
          }}
          className="w-[95%] rounded-lg border-2 bg-gradient-to-br from-green-800 to-green-850 p-4 shadow-md tablet:h-[75%] tablet:w-[75%]"
        >
          {scoreboardMetadata?.playerRoundDetails && currentPlayerStats && (
            <div className="baseVertFlex h-full gap-2 mobileLarge:gap-4 tablet:gap-8">
              <div className="text-xl font-semibold">Scoreboard</div>

              {/* player totals */}
              <div className="baseVertFlex min-h-[170px] w-full gap-1">
                <div
                  style={{
                    gridTemplateColumns: "50px auto 50px",
                  }}
                  className="grid w-full max-w-xl place-items-center"
                >
                  <FaTrophy
                    style={{
                      color: "hsl(120deg 100% 86%)",
                    }}
                    className="h-4 w-4"
                  />
                  <div className="font-semibold">Player</div>
                  <div className="font-semibold">Total</div>
                </div>

                {sortedPlayerRoundDetails.map((player) => (
                  <motion.div
                    key={player.playerID}
                    layoutId={player.playerID}
                    layout={"position"}
                    style={{
                      gridTemplateColumns: "50px auto 50px",
                      order: showNewRankings
                        ? player.newRanking
                        : player.oldRanking,
                    }}
                    className="grid w-full max-w-xl place-items-center"
                  >
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
                      className="grid h-8 w-full grid-cols-1 items-center justify-items-center rounded-l-md"
                    >
                      <AnimatePresence mode={"wait"}>
                        {showNewRankings && (
                          <motion.div
                            key={`newRanking${player.playerID}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="col-start-1 row-start-1 drop-shadow-md"
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
                            className="col-start-1 row-start-1 drop-shadow-md"
                          >
                            {ranking[player.oldRanking] ?? "-"}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div
                      style={{
                        backgroundColor:
                          playerColorVariants[player.playerID]?.baseColor ??
                          "white",
                      }}
                      className="baseVertFlex h-8 w-full gap-2 p-2 font-semibold"
                    >
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

                    <div
                      style={{
                        backgroundColor:
                          playerColorVariants[player.playerID]?.baseColor ??
                          "white",
                      }}
                      className="baseFlex h-8 w-full rounded-r-md"
                    >
                      <AnimatedNumber
                        value={
                          animateTotalValue ? player.newScore : player.oldScore
                        }
                        duration={animateTotalValue ? 1000 : 0}
                        order={
                          player.newScore > player.oldScore ? "asc" : "desc"
                        }
                        style={{
                          color:
                            playerColorVariants[player.playerID]?.textColor,
                        }}
                        size={16}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="baseFlex h-full max-h-72 w-full max-w-xl">
                <div
                  key={currentPlayerStats.playerID}
                  className="baseVertFlex h-full w-full shadow-md"
                >
                  {/* avatar + username */}
                  <div
                    style={{
                      backgroundColor:
                        playerColorVariants[currentPlayerStats.playerID]
                          ?.baseColor ?? "white",
                      color:
                        playerColorVariants[currentPlayerStats.playerID]
                          ?.textColor ?? "black",
                    }}
                    className="baseVertFlex h-18 w-full gap-2 rounded-t-md py-1 font-semibold"
                  >
                    Score breakdown
                  </div>

                  {/* anim. scores + cards */}
                  <div
                    style={{
                      backgroundColor:
                        playerColorVariants[currentPlayerStats.playerID]
                          ?.animatedCardsBackgroundColor ?? "white",
                      color:
                        playerColorVariants[currentPlayerStats.playerID]
                          ?.textColor ?? "black",
                    }}
                    className="baseVertFlex relative z-[1] h-full w-full overflow-hidden"
                  >
                    <div
                      style={{
                        backgroundColor:
                          playerColorVariants[currentPlayerStats.playerID]
                            ?.pointsBackgroundColor ?? "white",
                      }}
                      className="baseVertFlex z-[3] w-full bg-black bg-opacity-30 p-2"
                    >
                      <div className="align-center flex w-full justify-between px-8 leading-5">
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
                                ? currentPlayerStats.cardsPlayed.length
                                : 0
                            }
                            duration={animateCardsPlayedValue ? 1000 : 0}
                            order={"asc"}
                            size={16}
                          />
                        </div>
                      </div>

                      <div className="align-center flex w-full justify-between px-8 leading-5">
                        Squeak
                        <div className="baseFlex">
                          <div
                            style={{
                              opacity: animateSqueakModifierValue ? 1 : 0,
                            }}
                            className="transition-opacity"
                          >
                            {currentPlayerStats.squeakModifier > 0 ? "+" : ""}
                          </div>
                          <AnimatedNumber
                            value={
                              animateSqueakModifierValue
                                ? currentPlayerStats.squeakModifier
                                : 0
                            }
                            duration={animateSqueakModifierValue ? 1000 : 0}
                            order={
                              currentPlayerStats.squeakModifier > 0
                                ? "asc"
                                : "desc"
                            }
                            size={16}
                          />
                        </div>
                      </div>

                      <div className="align-center mt-1 flex w-full justify-between px-8 text-lg font-medium">
                        Total
                        <AnimatedNumber
                          value={
                            animateTotalValue
                              ? currentPlayerStats.newScore
                              : currentPlayerStats.oldScore
                          }
                          duration={animateTotalValue ? 1000 : 0}
                          order={
                            currentPlayerStats.newScore >
                            currentPlayerStats.oldScore
                              ? "asc"
                              : "desc"
                          }
                          size={22}
                        />
                      </div>
                    </div>

                    <AnimatedCardContainer
                      cards={currentPlayerStats.cardsPlayed}
                      playerID={currentPlayerStats.playerID}
                    />
                  </div>

                  {/* ranking */}
                  <div
                    style={{
                      backgroundColor:
                        playerColorVariants[currentPlayerStats.playerID]
                          ?.baseColor ?? "white",
                      color:
                        playerColorVariants[currentPlayerStats.playerID]
                          ?.textColor ?? "black",
                    }}
                    className="grid w-full grid-cols-1 items-center justify-items-center gap-2 rounded-b-md p-2"
                  >
                    <AnimatePresence mode={"wait"}>
                      {showNewRankings && (
                        <motion.div
                          key={`newRanking${currentPlayerStats.playerID}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="col-start-1 row-start-1 font-semibold drop-shadow-md"
                        >
                          {ranking[currentPlayerStats.newRanking]}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode={"wait"}>
                      {!showNewRankings && (
                        <motion.div
                          key={`oldRanking${currentPlayerStats.playerID}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="col-start-1 row-start-1 font-semibold drop-shadow-md"
                        >
                          {ranking[currentPlayerStats.oldRanking] ?? "-"}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
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
                className="baseFlex gap-4 rounded-md px-4 py-2 transition-all"
              >
                {/* left confetti cannon */}
                <Image
                  ref={leftConfettiCannonRef}
                  style={{
                    opacity: showConfettiPoppers ? 1 : 0,
                    transform: showConfettiPoppers
                      ? "scale(1) rotate(225deg)"
                      : "scale(0) rotate(225deg)",
                    filter: "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                  }}
                  className="h-6 w-6 transition-all"
                  src={confettiPopper}
                  alt={"left celebratory confetti cannon"}
                />

                <div className="baseFlex gap-2">
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
                    size={"2.5rem"}
                  />
                  <div
                    style={{
                      color:
                        playerColorVariants[
                          scoreboardMetadata.gameWinnerID ??
                            scoreboardMetadata.roundWinnerID
                        ]?.textColor ?? "black",
                    }}
                    className="text-sm"
                  >
                    {scoreboardMetadata.gameWinnerID
                      ? playerMetadata[scoreboardMetadata.gameWinnerID]
                          ?.username
                      : playerMetadata[scoreboardMetadata.roundWinnerID]
                          ?.username}
                    {` won the ${
                      scoreboardMetadata.gameWinnerID ? "game" : "round"
                    }!`}
                  </div>
                </div>

                {/* right confetti cannon */}
                <Image
                  ref={rightConfettiCannonRef}
                  style={{
                    opacity: showConfettiPoppers ? 1 : 0,
                    transform: showConfettiPoppers
                      ? "scale(1) rotate(135deg)"
                      : "scale(0) rotate(135deg)",
                    filter: "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                  }}
                  className="h-6 w-6 transition-all"
                  src={confettiPopper}
                  alt={"right celebratory confetti cannon"}
                />
              </div>

              <div
                style={{
                  opacity: showHostActionButton ? 1 : 0,
                  pointerEvents: showHostActionButton ? "auto" : "none",
                }}
                className="baseFlex gap-2"
              >
                {userID === roomConfig.hostUserID ? (
                  <Button
                    innerText={
                      scoreboardMetadata.gameWinnerID !== null
                        ? "Return to room"
                        : "Start next round"
                    }
                    innerTextWhenLoading={
                      scoreboardMetadata.gameWinnerID !== null
                        ? "Returning to room"
                        : "Starting next round"
                    }
                    onClickFunction={() => {
                      setPlayerIDWhoSqueaked(null);

                      if (userID === roomConfig.hostUserID) {
                        socket.emit("resetGame", {
                          roomCode: roomConfig.code,
                          gameIsFinished:
                            scoreboardMetadata.gameWinnerID !== null,
                        });
                      }
                    }}
                    showLoadingSpinnerOnClick={true}
                    className="gap-2"
                  />
                ) : (
                  <div className="baseFlex !items-baseline gap-1">
                    <p>
                      waiting for{" "}
                      <span className="font-semibold">
                        {roomConfig.hostUsername}
                      </span>{" "}
                      to
                      {scoreboardMetadata.gameWinnerID
                        ? " return to room"
                        : " start next round"}
                    </p>
                    <div className="loadingDots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                )}
              </div>

              {/* <div
                style={{
                  opacity: showCountdownTimer ? 1 : 0,
                  pointerEvents: showCountdownTimer ? "auto" : "none",
                }}
                className="baseFlex gap-2 transition-all"
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
                  size={16}
                />
              </div> */}
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={"scoreboardModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="baseFlex absolute left-0 top-0 z-[200] h-full w-full bg-black bg-opacity-60"
    >
      <motion.div
        key={"scoreboardModalInner"}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.15, delay: 0.35 }}
        style={{
          color: "hsl(120deg 100% 86%)",
          borderColor: "hsl(120deg 100% 86%)",
        }}
        className="h-[95%] w-[95%] rounded-lg border-2 bg-gradient-to-br from-green-800 to-green-850 p-4 shadow-md tablet:h-[85%] tablet:w-[85%] desktop:h-[75%] desktop:w-[75%]"
      >
        {scoreboardMetadata?.playerRoundDetails && (
          <div className="baseVertFlex h-full gap-2 desktop:gap-8">
            <div className="text-2xl font-semibold">Scoreboard</div>

            <div className="baseFlex h-full max-h-[400px] w-full gap-4">
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
                      className="baseVertFlex w-full gap-2 rounded-t-md pb-2 pt-3 font-semibold"
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
                      className="baseVertFlex relative z-[1] h-full w-full overflow-hidden"
                    >
                      <div
                        style={{
                          backgroundColor:
                            playerColorVariants[player.playerID]
                              ?.pointsBackgroundColor ?? "white",
                        }}
                        className="baseVertFlex z-[3] w-full bg-black bg-opacity-30 p-2"
                      >
                        <div className="align-center flex w-full justify-between px-4 text-lg leading-6 desktop:px-8">
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

                        <div className="align-center flex w-full justify-between px-4 text-lg leading-6 desktop:px-8">
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

                        <div className="align-center mt-1 flex w-full justify-between px-4 text-xl font-medium desktop:px-8">
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
                            className="col-start-1 row-start-1 font-semibold drop-shadow-md"
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
                            className="col-start-1 row-start-1 font-semibold drop-shadow-md"
                          >
                            {ranking[player.oldRanking] ?? "-"}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ),
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
              className="baseFlex gap-4 rounded-md px-4 py-2 transition-all desktop:p-4"
            >
              {/* left confetti cannon */}
              <Image
                ref={leftConfettiCannonRef}
                style={{
                  opacity: showConfettiPoppers ? 1 : 0,
                  transform: showConfettiPoppers
                    ? "scale(1) rotate(135deg)"
                    : "scale(0) rotate(135deg)",
                  filter: "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                }}
                className="h-8 w-8 transition-all"
                src={confettiPopper}
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
                ref={rightConfettiCannonRef}
                style={{
                  opacity: showConfettiPoppers ? 1 : 0,
                  transform: showConfettiPoppers
                    ? "scale(1) rotate(225deg)"
                    : "scale(0) rotate(225deg)",
                  filter: "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                }}
                className="h-8 w-8 transition-all"
                src={confettiPopper}
                alt={"right celebratory confetti cannon"}
              />
            </div>

            <div
              style={{
                opacity: showHostActionButton ? 1 : 0,
                pointerEvents: showHostActionButton ? "auto" : "none",
              }}
              className="baseFlex gap-2"
            >
              {userID === roomConfig.hostUserID ? (
                <Button
                  innerText={
                    scoreboardMetadata.gameWinnerID !== null
                      ? "Return to room"
                      : "Start next round"
                  }
                  innerTextWhenLoading={
                    scoreboardMetadata.gameWinnerID !== null
                      ? "Returning to room"
                      : "Starting next round"
                  }
                  onClickFunction={() => {
                    setPlayerIDWhoSqueaked(null);

                    if (userID === roomConfig.hostUserID) {
                      socket.emit("resetGame", {
                        roomCode: roomConfig.code,
                        gameIsFinished:
                          scoreboardMetadata.gameWinnerID !== null,
                      });
                    }
                  }}
                  showLoadingSpinnerOnClick={true}
                  className="gap-2"
                />
              ) : (
                <div className="baseFlex !items-baseline gap-1">
                  <p>
                    waiting for{" "}
                    <span className="font-semibold">
                      {roomConfig.hostUsername}
                    </span>{" "}
                    to
                    {scoreboardMetadata.gameWinnerID
                      ? " return to room"
                      : " start next round"}
                  </p>
                  <div className="loadingDots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              )}
            </div>

            {/* <div
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
            </div> */}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Scoreboard;
