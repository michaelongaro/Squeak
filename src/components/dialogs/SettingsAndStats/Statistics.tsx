import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { useMainStore } from "~/stores/MainStore";

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

function Statistics() {
  const { userID } = useMainStore((state) => ({
    userID: state.userID,
  }));

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
    <motion.div
      key={"statistics"}
      initial={{ opacity: 0, x: "25%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "25%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="baseVertFlex text-lightGreen"
    >
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
    </motion.div>
  );
}

export default Statistics;
