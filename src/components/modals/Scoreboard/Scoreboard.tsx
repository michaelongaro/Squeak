import { useState, useEffect, useMemo, useRef } from "react";
import { socket } from "~/pages/_app";
import AnimatedCardContainer from "./AnimatedCardContainer";
import AnimatedNumbers from "~/components/ui/AnimatedNumbers";
import confetti from "canvas-confetti";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useRoomContext } from "../../../context/RoomContext";
import PlayerIcon from "../../playerIcons/PlayerIcon";
import { FaTrophy } from "react-icons/fa6";
import confettiPopper from "../../../../public/scoreboard/confettiPopper.svg";
import { useUserIDContext } from "../../../context/UserIDContext";
import { type IPlayerRoundDetails } from "../../../pages/api/handlers/roundOverHandler";
import { Button } from "~/components/ui/button";

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
  const userID = useUserIDContext();

  const {
    audioContext,
    masterVolumeGainNode,
    confettiPopBuffer,
    playerMetadata,
    currentVolume,
    roomConfig,
    scoreboardMetadata,
    viewportLabel,
    gameData,
    setPlayerIDWhoSqueaked,
  } = useRoomContext();

  const [initalizedTimers, setInitalizedTimers] = useState(false);

  const [showNewRankings, setShowNewRankings] = useState<boolean>(false);
  const [showWinningPlayerMessage, setShowWinningPlayerMessage] =
    useState<boolean>(false);
  const [showHostActionButton, setShowHostActionButton] =
    useState<boolean>(false);

  const [animateCardsPlayedValue, setAnimateCardsPlayedValue] =
    useState<boolean>(false);
  const [animateSqueakModifierValue, setAnimateSqueakModifierValue] =
    useState<boolean>(false);
  const [animateTotalValue, setAnimateTotalValue] = useState<boolean>(false);
  const [showConfettiPoppers, setShowConfettiPoppers] =
    useState<boolean>(false);

  const [playerColorVariants, setPlayerColorVariants] =
    useState<IPlayerColorVariants>({});

  const [sortedPlayerRoundDetails, setSortedPlayerRoundDetails] = useState<
    IPlayerRoundDetails[]
  >([]);

  const [hostActionButtonText, setHostActionButtonText] = useState<string>("");

  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [countdownType, setCountdownType] = useState<
    "startRound" | "returnToRoom" | null
  >(null);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);

  const leftConfettiCannonRef = useRef<HTMLImageElement>(null);
  const rightConfettiCannonRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (initalizedTimers) return;

    setInitalizedTimers(true);

    setHostActionButtonText(
      scoreboardMetadata?.gameWinnerID === null
        ? "Start next round"
        : "Return to room",
    );

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

      setTimeout(() => {
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
              spread: viewportLabel.includes("mobile") ? 45 : 30,
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
              spread: viewportLabel.includes("mobile") ? 45 : 30,
              startVelocity: 35,
              angle: viewportLabel.includes("mobile") ? 135 : 45,
              zIndex: 200,
            },
            {
              particleCount: 100,
            },
          ),
        );
      }, 300); // waiting for the motion.divs to be rendered with +100ms of delay
    }, 6500);

    setTimeout(() => {
      setShowConfettiPoppers(false);
      setShowHostActionButton(true);
    }, 8500);
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

  // TODO: can combine together into one emit/effect for sure
  useEffect(() => {
    function handleStartRoundCountdown(hostUserID: string) {
      setShowCountdown(true);
      setCountdownType("startRound");

      setTimeout(() => {
        setCountdownValue(3);

        setTimeout(() => {
          setCountdownValue(2);

          setTimeout(() => {
            setCountdownValue(1);

            setTimeout(() => {
              setPlayerIDWhoSqueaked(null);

              if (userID === hostUserID) {
                socket.emit("resetGame", {
                  roomCode: roomConfig.code,
                  gameIsFinished: false,
                });
              }
            }, 500);
          }, 1000);
        }, 1000);
      }, 500);
    }

    function handleReturnToRoomCountdown(hostUserID: string) {
      setShowCountdown(true);
      setCountdownType("returnToRoom");

      setTimeout(() => {
        setCountdownValue(3);

        setTimeout(() => {
          setCountdownValue(2);

          setTimeout(() => {
            setCountdownValue(1);

            setTimeout(() => {
              setPlayerIDWhoSqueaked(null);

              if (userID === hostUserID) {
                socket.emit("resetGame", {
                  roomCode: roomConfig.code,
                  gameIsFinished: true,
                });
              }
            }, 500);
          }, 1000);
        }, 1000);
      }, 500);
    }

    socket.on("startRoundCountdown", handleStartRoundCountdown);
    socket.on("returnToRoomCountdown", handleReturnToRoomCountdown);

    return () => {
      socket.off("startRoundCountdown", handleStartRoundCountdown);
      socket.off("returnToRoomCountdown", handleReturnToRoomCountdown);
    };
  }, [roomConfig.code, setPlayerIDWhoSqueaked, userID]);

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

  function getDynamicMobileScoreboardTableHeight() {
    const maxPlayers = 4;
    const playersInRoom = Object.keys(playerMetadata).length;
    // Calculate the decrement height based on the number of players less than the maximum
    const height = 170 - (maxPlayers - playersInRoom) * 32;

    return height;
  }

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
            <div className="baseVertFlex h-full gap-6 tablet:gap-8">
              <div className="baseFlex w-full !items-start !justify-between">
                <div className="text-xl font-semibold">Scoreboard</div>

                <div className="baseVertFlex !items-end text-sm">
                  <div>Round {gameData.currentRound}</div>
                  <div>Goal: {roomConfig.pointsToWin} points</div>
                </div>
              </div>

              {/* player totals */}
              <div
                className={`baseVertFlex min-h-[${getDynamicMobileScoreboardTableHeight}px] w-full gap-1`}
              >
                <div
                  style={{
                    gridTemplateColumns: "50px auto 50px",
                  }}
                  // order is -2 since player's "rankInRoom" value initializes at -1
                  // when the game starts
                  className="order-[-2] grid w-full max-w-xl place-items-center"
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
                        color: playerColorVariants[player.playerID]?.textColor,
                      }}
                      className="baseFlex h-8 w-full rounded-r-md"
                    >
                      <AnimatedNumbers
                        value={
                          animateTotalValue ? player.newScore : player.oldScore
                        }
                        padding={10}
                        fontSize={16}
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
                    className="baseVertFlex h-18 w-full gap-2 rounded-t-md py-1 text-sm font-semibold"
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
                    className="baseFlex relative z-[1] h-full w-full overflow-hidden"
                  >
                    <div
                      style={{
                        backgroundColor:
                          playerColorVariants[currentPlayerStats.playerID]
                            ?.pointsBackgroundColor ?? "white",
                      }}
                      className="baseVertFlex z-[3] min-h-[115px] w-full gap-2 bg-black bg-opacity-30 p-2"
                    >
                      <div className="align-center flex w-full justify-between gap-4 text-nowrap px-3 text-sm leading-5">
                        Cards played
                        <div className="baseFlex">
                          <div
                            style={{
                              opacity: animateCardsPlayedValue ? 1 : 0,
                            }}
                            className="mr-1 transition-opacity"
                          >
                            +
                          </div>
                          <AnimatedNumbers
                            value={
                              animateCardsPlayedValue
                                ? currentPlayerStats.cardsPlayed.length
                                : 0
                            }
                            padding={6}
                            fontSize={14}
                          />
                        </div>
                      </div>

                      <div className="align-center flex w-full justify-between gap-4 px-3 text-sm leading-5">
                        Squeak
                        <div className="baseFlex">
                          <div
                            style={{
                              opacity: animateSqueakModifierValue ? 1 : 0,
                            }}
                            className="mr-1 transition-opacity"
                          >
                            {currentPlayerStats.squeakModifier > 0 ? "+" : ""}
                          </div>
                          <AnimatedNumbers
                            value={
                              animateSqueakModifierValue
                                ? currentPlayerStats.squeakModifier
                                : 0
                            }
                            padding={6}
                            fontSize={14}
                          />
                        </div>
                      </div>

                      <div className="align-center mt-1 flex w-full justify-between gap-4 px-3 font-medium">
                        Total
                        <AnimatedNumbers
                          value={
                            animateTotalValue
                              ? currentPlayerStats.newScore
                              : currentPlayerStats.oldScore
                          }
                          padding={8}
                          fontSize={16}
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
                    className="grid w-full grid-cols-1 items-center justify-items-center gap-2 rounded-b-md p-2 text-sm"
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
                className="baseFlex relative w-full max-w-xl gap-4 rounded-md px-10 py-2 transition-all duration-300"
              >
                <AnimatePresence>
                  {showConfettiPoppers && (
                    <motion.div
                      initial={{ opacity: 0, width: 0, scale: 0 }}
                      animate={{ opacity: 1, width: "auto", scale: 1 }}
                      exit={{ opacity: 0, width: 0, scale: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="baseFlex absolute left-2 top-4"
                    >
                      {/* left confetti cannon */}
                      <Image
                        ref={leftConfettiCannonRef}
                        style={{
                          filter:
                            "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                        }}
                        className="h-6 w-6 rotate-[225deg] transition-all"
                        src={confettiPopper}
                        alt={"left celebratory confetti cannon"}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

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
                <AnimatePresence>
                  {showConfettiPoppers && (
                    <motion.div
                      initial={{ opacity: 0, width: 0, scale: 0 }}
                      animate={{ opacity: 1, width: "auto", scale: 1 }}
                      exit={{ opacity: 0, width: 0, scale: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="baseFlex absolute right-2 top-4"
                    >
                      <Image
                        ref={rightConfettiCannonRef}
                        style={{
                          filter:
                            "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                        }}
                        className="h-6 w-6 rotate-[135deg] transition-all"
                        src={confettiPopper}
                        alt={"right celebratory confetti cannon"}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div
                style={{
                  opacity: showHostActionButton ? 1 : 0,
                  pointerEvents: showHostActionButton ? "auto" : "none",
                }}
                className="baseFlex gap-2 transition-all"
              >
                {userID === roomConfig.hostUserID && (
                  <AnimatePresence mode="wait">
                    {!showCountdown ? (
                      <motion.div
                        key={"waitingForHostToStart"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="baseFlex"
                      >
                        <Button
                          disabled={hostActionButtonText === "Loading"}
                          onClick={() => {
                            setHostActionButtonText("Loading");

                            setTimeout(() => {
                              socket.emit("broadcastRoomActionCountdown", {
                                code: roomConfig.code,
                                hostUserID: userID,
                                type:
                                  scoreboardMetadata.gameWinnerID === null
                                    ? "startRound"
                                    : "returnToRoom",
                              });
                            }, 1000);
                          }}
                          className="h-11 w-[14rem] text-sm font-medium"
                        >
                          <AnimatePresence mode={"popLayout"} initial={false}>
                            <motion.div
                              key={hostActionButtonText}
                              layout
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              transition={{
                                duration: 0.25,
                              }}
                              className="baseFlex h-11 w-[14rem] gap-4"
                            >
                              {hostActionButtonText}
                              {hostActionButtonText === "Loading" && (
                                <div
                                  className="inline-block size-4 animate-spin rounded-full border-[2px] border-darkGreen border-t-transparent text-darkGreen"
                                  role="status"
                                  aria-label="loading"
                                >
                                  <span className="sr-only">Loading...</span>
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={"startRoundCountdown"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="baseFlex h-11 gap-2"
                      >
                        {countdownType === "startRound" ? (
                          <p>Next round starting in</p>
                        ) : (
                          <p>Returning to room in</p>
                        )}
                        <AnimatedNumbers
                          value={countdownValue}
                          fontSize={16}
                          padding={2}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {userID !== roomConfig.hostUserID && (
                  <AnimatePresence mode="wait">
                    {!showCountdown ? (
                      <motion.div
                        key={"waitingForHostToStart"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="baseFlex !items-baseline gap-1"
                      >
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
                      </motion.div>
                    ) : (
                      <motion.div
                        key={"startRoundCountdown"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="baseFlex gap-2"
                      >
                        {countdownType === "startRound" ? (
                          <p>Next round starting in</p>
                        ) : (
                          <p>Returning to room in</p>
                        )}
                        <AnimatedNumbers
                          value={countdownValue}
                          fontSize={16}
                          padding={2}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
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
          <div className="baseVertFlex relative h-full gap-2 desktop:gap-8">
            <div className="baseFlex absolute left-2 top-2 gap-2">
              <div>Round {gameData.currentRound}</div>

              <div className="h-4 w-[1px] rounded-md bg-lightGreen"></div>

              <div>Goal: {roomConfig.pointsToWin} points</div>
            </div>

            <div className="baseFlex w-full">
              <div className="text-2xl font-semibold">Scoreboard</div>
            </div>

            <div className="baseFlex h-full max-h-[400px] w-full gap-4">
              {Object.values(scoreboardMetadata.playerRoundDetails).map(
                (player) => (
                  <div
                    key={player.playerID}
                    className="baseVertFlex h-full w-full max-w-md shadow-md"
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
                              className="mr-1 transition-opacity"
                            >
                              +
                            </div>
                            <AnimatedNumbers
                              value={
                                animateCardsPlayedValue
                                  ? player.cardsPlayed.length
                                  : 0
                              }
                              padding={6}
                              fontSize={18}
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
                              className="mr-1 transition-opacity"
                            >
                              {player.squeakModifier > 0 ? "+" : ""}
                            </div>
                            <AnimatedNumbers
                              value={
                                animateSqueakModifierValue
                                  ? player.squeakModifier
                                  : 0
                              }
                              padding={6}
                              fontSize={18}
                            />
                          </div>
                        </div>

                        <div className="align-center mt-1 flex w-full justify-between px-4 text-xl font-medium desktop:px-8">
                          Total
                          <AnimatedNumbers
                            value={
                              animateTotalValue
                                ? player.newScore
                                : player.oldScore
                            }
                            padding={4}
                            fontSize={22}
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
              className="baseFlex relative gap-4 rounded-md px-16 py-3 transition-all duration-300"
            >
              {/* left confetti cannon */}
              <AnimatePresence>
                {showConfettiPoppers && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, scale: 0 }}
                    animate={{ opacity: 1, width: "auto", scale: 1 }}
                    exit={{ opacity: 0, width: 0, scale: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="baseFlex absolute left-3 top-5"
                  >
                    <Image
                      ref={leftConfettiCannonRef}
                      style={{
                        filter: "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                      }}
                      className="h-8 w-8 rotate-[135deg] transition-all"
                      src={confettiPopper}
                      alt={"left celebratory confetti cannon"}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

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
                className="text-lg"
              >
                {scoreboardMetadata.gameWinnerID
                  ? playerMetadata[scoreboardMetadata.gameWinnerID]?.username
                  : playerMetadata[scoreboardMetadata.roundWinnerID]?.username}
                {` won the ${
                  scoreboardMetadata.gameWinnerID ? "game" : "round"
                }!`}
              </div>

              {/* right confetti cannon */}
              <AnimatePresence>
                {showConfettiPoppers && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, scale: 0 }}
                    animate={{ opacity: 1, width: "auto", scale: 1 }}
                    exit={{ opacity: 0, width: 0, scale: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="baseFlex absolute right-3 top-5"
                  >
                    <Image
                      ref={rightConfettiCannonRef}
                      style={{
                        filter: "drop-shadow(rgba(0,0,0, 0.10) 0px 0px 0.5rem)",
                      }}
                      className="h-8 w-8 rotate-[225deg] transition-all"
                      src={confettiPopper}
                      alt={"right celebratory confetti cannon"}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              style={{
                opacity: showHostActionButton ? 1 : 0,
                pointerEvents: showHostActionButton ? "auto" : "none",
              }}
              className="baseFlex gap-2 transition-all"
            >
              {userID === roomConfig.hostUserID && (
                <AnimatePresence mode="wait">
                  {!showCountdown ? (
                    <motion.div
                      key={"waitingForHostToStart"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="baseFlex"
                    >
                      <Button
                        disabled={hostActionButtonText === "Loading"}
                        onClick={() => {
                          setHostActionButtonText("Loading");

                          setTimeout(() => {
                            socket.emit("broadcastRoomActionCountdown", {
                              code: roomConfig.code,
                              hostUserID: userID,
                              type:
                                scoreboardMetadata.gameWinnerID === null
                                  ? "startRound"
                                  : "returnToRoom",
                            });
                          }, 1000);
                        }}
                        className="h-11 w-[14rem] font-medium"
                      >
                        <AnimatePresence mode={"popLayout"} initial={false}>
                          <motion.div
                            key={hostActionButtonText}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{
                              duration: 0.25,
                            }}
                            className="baseFlex h-11 w-[14rem] gap-4"
                          >
                            {hostActionButtonText}
                            {hostActionButtonText === "Loading" && (
                              <div
                                className="inline-block size-4 animate-spin rounded-full border-[2px] border-darkGreen border-t-transparent text-darkGreen"
                                role="status"
                                aria-label="loading"
                              >
                                <span className="sr-only">Loading...</span>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={"startRoundCountdown"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="baseFlex h-11 gap-2"
                    >
                      {countdownType === "startRound" ? (
                        <p>Next round starting in</p>
                      ) : (
                        <p>Returning to room in</p>
                      )}
                      <AnimatedNumbers
                        value={countdownValue}
                        fontSize={16}
                        padding={2}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {userID !== roomConfig.hostUserID && (
                <AnimatePresence mode="wait">
                  {!showCountdown ? (
                    <motion.div
                      key={"waitingForHostToStart"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="baseFlex !items-baseline gap-1"
                    >
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
                    </motion.div>
                  ) : (
                    <motion.div
                      key={"startRoundCountdown"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="baseFlex gap-2"
                    >
                      {countdownType === "startRound" ? (
                        <p>Next round starting in</p>
                      ) : (
                        <p>Returning to room in</p>
                      )}
                      <AnimatedNumbers
                        value={countdownValue}
                        fontSize={16}
                        padding={2}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Scoreboard;
