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
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";

interface IRanking {
  [key: number]: string;
}

const ranking: IRanking = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
  5: "5th",
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
    if (initalizedTimers || scoreboardMetadata === null) return;

    setInitalizedTimers(true);

    setHostActionButtonText(
      scoreboardMetadata.gameWinnerID === null
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
        scoreboardMetadata.playerRoundDetails,
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
              startVelocity: 30,
              angle: viewportLabel.includes("mobile") ? 45 : 135,
              zIndex: 500,
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
              startVelocity: 30,
              angle: viewportLabel.includes("mobile") ? 135 : 45,
              zIndex: 500,
            },
            {
              particleCount: 100,
            },
          ),
        );
      }, 350); // waiting for the motion.divs to be rendered with +150ms of delay
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
                socket.volatile.emit("resetGame", {
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
                socket.volatile.emit("resetGame", {
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
      const oklchColor = playerMetadata[userID]?.color;

      if (!oklchColor) return;

      // Extract the lightness, chroma, and hue components from the OKLCH color string
      const matches = oklchColor.match(
        /oklch\((\d+\.?\d*)%\s+(\d+\.?\d*)\s+(\d+\.?\d*)\)/,
      );

      if (!matches) return;

      const [_, lightnessStr, chromaStr, hueStr] = matches;

      if (!lightnessStr || !chromaStr || !hueStr) return;

      const lightness = parseFloat(lightnessStr);
      const chroma = parseFloat(chromaStr);
      const hue = parseFloat(hueStr);

      // Generate the variants based on the lightness adjustments
      newPlayerColorVariants[userID] = {
        baseColor: oklchColor,
        pointsBackgroundColor: `oklch(${(lightness * 0.75).toFixed(2)}% ${chroma.toFixed(3)} ${hue.toFixed(2)})`,
        textColor: `oklch(${Math.min(lightness * 1.5, 100).toFixed(2)}% ${chroma.toFixed(3)} ${hue.toFixed(2)})`, // Ensure lightness doesn't exceed 100%
        animatedCardsBackgroundColor: `oklch(100% ${chroma.toFixed(3)} ${hue.toFixed(2)})`,
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
        key={"mobileScoreboardDialog"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <DialogContent className="z-[500] w-[95%] rounded-lg border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 p-4 text-lightGreen shadow-md tablet:h-[75%] tablet:w-[75%]">
          <VisuallyHidden>
            <DialogTitle>
              {scoreboardMetadata?.gameWinnerID ? "Game over!" : "Round over!"}
            </DialogTitle>
            <DialogDescription>
              View the final scores and rankings of the players
            </DialogDescription>
          </VisuallyHidden>

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
                  <FaTrophy className="-mr-5 size-4 text-lightGreen" />
                  <div className="font-semibold">Player</div>
                  <div className="mr-4 font-semibold">Total</div>
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
                      className="grid h-8 w-full grid-cols-1 items-center justify-items-start rounded-l-md pl-5"
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
                      className="baseFlex h-8 w-full !justify-end rounded-r-md pr-5"
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
                      className="baseFlex absolute left-2 top-4 z-[500]"
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
                      ]?.color ?? "oklch(64.02% 0.171 15.38)"
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
                      className="baseFlex absolute right-2 top-4 z-[500]"
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
                              socket.volatile.emit(
                                "broadcastRoomActionCountdown",
                                {
                                  code: roomConfig.code,
                                  hostUserID: userID,
                                  type:
                                    scoreboardMetadata.gameWinnerID === null
                                      ? "startRound"
                                      : "returnToRoom",
                                },
                              );
                            }, 1000);
                          }}
                          className="h-11 w-[14rem] text-sm font-medium"
                        >
                          <AnimatePresence mode={"popLayout"} initial={false}>
                            <motion.div
                              key={hostActionButtonText}
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
                        className="!inline-block max-w-64 !items-baseline gap-1"
                      >
                        <p className="inline-block items-baseline text-center">
                          <span>
                            waiting for{" "}
                            <span className="font-semibold">
                              {roomConfig.hostUsername}
                            </span>{" "}
                            to
                            {scoreboardMetadata.gameWinnerID
                              ? " return to room"
                              : " start the next round"}
                          </span>
                          <div className="loadingDots ml-1.5">
                            <div></div>
                            <div></div>
                            <div></div>
                          </div>
                        </p>
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
        </DialogContent>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={"tabletPlusScoreboardDialog"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <DialogContent className="z-[500] h-[95%] w-[95%] rounded-lg border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 p-4 text-lightGreen shadow-md tablet:h-auto tablet:w-[85%] desktop:w-[75%]">
        <VisuallyHidden>
          <DialogTitle>
            {scoreboardMetadata?.gameWinnerID ? "Game over!" : "Round over!"}
          </DialogTitle>
          <DialogDescription>
            View the final scores and rankings of the players
          </DialogDescription>
        </VisuallyHidden>

        {scoreboardMetadata?.playerRoundDetails && (
          <div className="baseVertFlex relative h-full gap-2 tablet:gap-6">
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
                          "oklch(64.02% 0.171 15.38)"
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
                    className="baseFlex absolute left-3 top-5 z-[500]"
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
                  ]?.color ?? "oklch(64.02% 0.171 15.38)"
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
                    className="baseFlex absolute right-3 top-5 z-[500]"
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
                            socket.volatile.emit(
                              "broadcastRoomActionCountdown",
                              {
                                code: roomConfig.code,
                                hostUserID: userID,
                                type:
                                  scoreboardMetadata.gameWinnerID === null
                                    ? "startRound"
                                    : "returnToRoom",
                              },
                            );
                          }, 1000);
                        }}
                        className="h-11 w-[14rem] font-medium"
                      >
                        <AnimatePresence mode={"popLayout"} initial={false}>
                          <motion.div
                            key={hostActionButtonText}
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
                      className="!inline-block !items-baseline gap-1"
                    >
                      <p className="inline-block items-baseline text-center">
                        <span>
                          waiting for{" "}
                          <span className="font-semibold">
                            {roomConfig.hostUsername}
                          </span>{" "}
                          to
                          {scoreboardMetadata.gameWinnerID
                            ? " return to room"
                            : " start the next round"}
                        </span>
                        <div className="loadingDots ml-1.5">
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                      </p>
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
      </DialogContent>
    </motion.div>
  );
}

export default Scoreboard;
