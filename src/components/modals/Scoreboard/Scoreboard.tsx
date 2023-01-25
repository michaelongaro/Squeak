import { useState, useEffect } from "react";
import CountUp from "react-countup";
import { useRoomContext } from "../../../context/RoomContext";
import useScoreboardData from "../../../hooks/useScoreboardData";
import { IScoreboardMetadata } from "../../../pages/api/handlers/roundOverHandler";
import AnimatedCardContainer from "./AnimatedCardContainer";

function Scoreboard() {
  const roomCtx = useRoomContext();

  // const scoreboardData = useScoreboardData();

  const [showNewRankings, setShowNewRankings] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNewRankings(true);
    }, 3000);
  }, []);

  const scoreboardData: Partial<IScoreboardMetadata> | null = {
    winnerID: "26d44c9f4211a557",
    playerRoundDetails: [
      {
        playerID: "26d44c9f4211a557",
        oldScore: 0,
        newScore: 25,
        oldRanking: 1,
        newRanking: 5,
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
        newRanking: 5,
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
    <div className="baseFlex z-501 absolute top-0 left-0 h-full w-full bg-black bg-opacity-60">
      <div className="h-[50%] w-[65%] rounded-lg bg-green-200 p-4">
        {scoreboardData?.playerRoundDetails && (
          <div className="baseVertFlex h-full gap-4">
            <div className="text-xl">Scoreboard</div>

            <div className="baseFlex h-full min-w-[350px] gap-4">
              {scoreboardData.playerRoundDetails.map((player) => (
                <div
                  key={player.playerID}
                  className="baseVertFlex h-full w-full rounded-md border-2 border-black shadow-md"
                >
                  {/* avatar + username */}
                  <div className="baseVertFlex w-full gap-2 border-b-2 border-black">
                    <div>avatar</div>
                    {player.playerID}
                  </div>

                  {/* anim. scores + cards */}
                  <div className="relative h-full w-full">
                    {/* ideally some kind of glassmorphism  */}
                    <div className="baseVertFlex absolute top-0 left-0 z-50 w-full bg-black bg-opacity-30 pt-2">
                      <div className="align-center flex w-full justify-between pl-2 pr-2">
                        Cards played <CountUp end={player.cardsPlayed.length} />
                      </div>
                      {/* make this red/green text */}
                      <div className="align-center flex w-full justify-between pl-2 pr-2">
                        Squeak <CountUp end={player.squeakModifier} />
                      </div>
                      <div className="align-center flex w-full justify-between pl-2 pr-2">
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
                  <div className="baseFlex w-full gap-2 border-t-2 border-black p-2">
                    {/* logic for showing 1st/2nd/3rd trophy icons */}
                    <div>
                      {showNewRankings ? player.newRanking : player.oldRanking}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* get avatar + username from IPlayerMetadata in ctx */}
            <div>Avatar PlayerWhoWon won the round!</div>
            <div className="baseFlex gap-2">
              <div>Next round starts in:</div>
              <CountUp start={5} end={1} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scoreboard;
