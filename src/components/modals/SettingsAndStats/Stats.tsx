import { useState, useEffect } from "react";
import { useUserIDContext } from "../../../context/UserIDContext";
import { trpc } from "../../../utils/trpc";

const rowNames = [
  "Total Squeaks",
  "Average place per round",
  "Average left in Squeak",
  "Highest score",
  "Lowest score",
  "Total games played",
];

interface IFilteredStats {
  squeaks: number;
  avgPlace: number;
  avgLeftInSqueak: number;
  highestScore: number;
  lowestScore: number;
  totalGamesPlayed: number;
}

function Stats() {
  const { value: userID } = useUserIDContext();

  const { data: userStats } = trpc.stats.getStatsByID.useQuery(userID);

  const [filteredStats, setFilteredStats] = useState<IFilteredStats>();

  useEffect(() => {
    if (userStats && filteredStats === undefined) {
      const filteredStats: IFilteredStats = {
        squeaks: userStats.squeaks,
        avgPlace: userStats.averageFinishingPlace,
        avgLeftInSqueak: userStats.averageLeftInSqueak,
        highestScore: userStats.highestScore,
        lowestScore: userStats.lowestScore,
        totalGamesPlayed: userStats.totalGamesPlayed,
      };

      setTimeout(() => {
        setFilteredStats(filteredStats);
      }, 500);
    }
  }, [userStats, filteredStats]);

  return (
    <div
      style={{
        color: "hsl(120deg 100% 86%)",
      }}
      className="baseVertFlex w-[700px] gap-8 bg-green-800 p-8"
    >
      <div
        style={{
          borderColor: "hsl(120deg 100% 86%)",
          color: "hsl(120deg 100% 86%)",
        }}
        className="baseVertFlex gap-4 rounded-md border-2 p-4"
      >
        {rowNames.map((rowName, index) => (
          <div key={index} className="baseFlex w-full !justify-between gap-8">
            <div className="text-xl">{rowName}</div>
            {filteredStats ? (
              <div className="text-xl">
                {Object.values(filteredStats)[index]}
              </div>
            ) : (
              <div
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderTop: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                  borderRight: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                  borderBottom: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                  borderLeft: `0.35rem solid hsl(120deg 100% 86%)`,
                }}
                className="loadingSpinner"
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Stats;
