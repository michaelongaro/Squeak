import { useState, useEffect } from "react";
import { useUserIDContext } from "../../../context/UserIDContext";
import { api } from "~/utils/api";
import { motion, AnimatePresence } from "framer-motion";

const rowNames = [
  "Total Squeaks",
  "Average cards left in Squeak pile",
  "Average rank per round",
  "Highest score per round",
  "Total games played",
];

interface IFilteredStats {
  squeaks: number;
  avgPlace: number;
  avgLeftInSqueak: number;
  highestScore: number;
  totalGamesPlayed: number;
}

function Stats() {
  const userID = useUserIDContext();

  const { data: userStats } = api.stats.getStatsByID.useQuery(userID);

  const [filteredStats, setFilteredStats] = useState<IFilteredStats>();

  useEffect(() => {
    if (userStats && filteredStats === undefined) {
      const filteredStats: IFilteredStats = {
        squeaks: userStats.squeaks,
        avgPlace: userStats.averageFinishingPlace,
        avgLeftInSqueak: userStats.averageLeftInSqueak,
        highestScore: userStats.highestScore,
        totalGamesPlayed: userStats.totalGamesPlayed,
      };

      setTimeout(() => {
        setFilteredStats(filteredStats);
      }, 1000);
    }
  }, [userStats, filteredStats]);

  return (
    <div className="baseVertFlex h-[328px] w-[700px] bg-gradient-to-br from-green-800 to-green-850 p-8 text-lightGreen">
      <div className="baseVertFlex gap-6 rounded-md border-2 border-lightGreen p-4 text-lightGreen">
        {rowNames.map((rowName, index) => (
          <div key={index} className="baseFlex w-full !justify-between gap-12">
            <div>{rowName}</div>

            <div className="w-16 text-right">
              <AnimatePresence mode="wait">
                {filteredStats ? (
                  <motion.div
                    key={`filteredStats${rowName}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {Object.values(filteredStats)[index]}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`loadingSpinner${rowName}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-block size-4 animate-spin rounded-full border-[2px] border-lightGreen border-t-transparent text-lightGreen"
                    role="status"
                    aria-label="loading"
                  >
                    <span className="sr-only">Loading...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Stats;
