import { useState, useEffect } from "react";
import CountUp from "react-countup";
import { useRoomContext } from "../../../context/RoomContext";
import useScoreboardData from "../../../hooks/useScoreboardData";
import { IScoreboardMetadata } from "../../../pages/api/handlers/roundOverHandler";
import AnimatedCardContainer from "./AnimatedCardContainer";

interface IRanking {
  [key: number]: string;
}

const ranking: IRanking = {
  1: "🥇 1st",
  2: "🥈 2nd",
  3: "🥉 3rd",
  4: "4th",
};

function Scoreboard() {
  const roomCtx = useRoomContext();

  // const scoreboardData = useScoreboardData();

  const [showNewRankings, setShowNewRankings] = useState<boolean>(false);
  const [showWinningPlayerMessage, setShowWinningPlayerMessage] =
    useState<boolean>(false);
  const [showCountdownTimer, setShowCountdownTimer] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNewRankings(true);
    }, 3000);

    setTimeout(() => {
      setShowWinningPlayerMessage(true);
    }, 6000);

    setTimeout(() => {
      setShowCountdownTimer(true);
    }, 9000);
  }, []);

  const scoreboardData: Partial<IScoreboardMetadata> | null = {
    gameWinnerID: null,
    roundWinnerID: "26d44c9f4211a557",
    playerRoundDetails: [
      {
        playerID: "26d44c9f4211a557",
        oldScore: 0,
        newScore: 25,
        oldRanking: 1,
        newRanking: 2,
        cardsPlayed: [
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
        ],
        squeakModifier: 10,
      },
      {
        playerID: "8ea9ee59061148a0",
        oldScore: 0,
        newScore: 2,
        oldRanking: 1,
        newRanking: 3,
        cardsPlayed: [
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
          {
            suit: "H",
            value: "A",
          },
        ],
        squeakModifier: -5,
      },
    ],
  };

  // have some kind of delay that will immediately have the data rendered below but still have
  // the opacity/pointer events of main modal be 0/none for a few seconds while squeak animation is playing

  return (
    <div
      style={{
        opacity: roomCtx.showScoreboard ? 1 : 0,
        pointerEvents: roomCtx.showScoreboard ? "auto" : "none",
      }}
      className="baseFlex absolute top-0 left-0 z-[600] h-full w-full bg-black bg-opacity-60 transition-all"
    >
      <div className="h-[60%] w-[65%] rounded-lg bg-green-200 p-4">
        {scoreboardData?.playerRoundDetails && (
          <div className="baseVertFlex h-full gap-4">
            <div className="text-2xl">Scoreboard</div>

            <div className="baseFlex h-full w-full gap-4">
              {scoreboardData.playerRoundDetails.map((player) => (
                <div
                  key={player.playerID}
                  className="baseVertFlex h-full w-full rounded-md border-2 border-black shadow-md"
                >
                  {/* avatar + username */}
                  <div className="baseFlex w-full gap-2 border-b-2 border-black">
                    <div>avatar</div>
                    {player.playerID}
                  </div>

                  {/* anim. scores + cards */}
                  <div className="relative z-[1] h-full w-full overflow-hidden">
                    {/* ideally some kind of glassmorphism  */}
                    <div className="baseVertFlex absolute top-0 left-0 z-[3] w-full bg-black bg-opacity-30 p-2">
                      <div className="align-center flex w-full justify-between  pl-8 pr-8 text-lg">
                        Cards played <CountUp end={player.cardsPlayed.length} />
                      </div>
                      {/* make this red/green text */}
                      <div className="align-center flex w-full justify-between  pl-8 pr-8 text-lg">
                        Squeak <CountUp end={player.squeakModifier} />
                      </div>
                      <div className="align-center flex w-full justify-between pl-8  pr-8 text-xl">
                        Total{" "}
                        <CountUp
                          start={player.oldScore}
                          end={player.newScore}
                        />
                      </div>
                    </div>

                    <AnimatedCardContainer
                      cards={player.cardsPlayed}
                      playerID={player.playerID}
                    />
                  </div>

                  {/* ranking */}
                  {/* currently thinking to have this area and avatar+username area on top to be a slightly
                      lighter (filter: brightness(1.1)?, so that the avatar background can still be seen easily)
                      (prob still want 1px black border around avatar), and then just have an obj for   */}
                  <div className="baseFlex w-full gap-2 rounded-b-md border-t-2 border-black p-2">
                    {showNewRankings
                      ? ranking[player.newRanking]
                      : ranking[player.oldRanking]}
                  </div>
                </div>
              ))}
            </div>

            {/* get avatar + username from IPlayerMetadata in ctx */}
            {/* have this fade in after scores are animated, with timeouts */}
            <div
              style={{
                opacity: showWinningPlayerMessage ? 1 : 0,
                pointerEvents: showWinningPlayerMessage ? "auto" : "none",
              }}
              className="text-xl transition-all"
            >
              Avatar PlayerWhoWon won the round!
            </div>
            {/* have this fade in after message above has been shown, with timeouts */}
            <div
              style={{
                opacity: showCountdownTimer ? 1 : 0,
                pointerEvents: showCountdownTimer ? "auto" : "none",
              }}
              className="baseFlex gap-2 transition-all"
            >
              <div>Next round starts in:</div>
              <div>
                <CountUp start={5} end={1} />
                ...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scoreboard;
