import { motion } from "framer-motion";
import { useMainStore } from "~/stores/MainStore";

function MiniMobileVotingModal() {
  const { playerMetadata, currentVotes, showVotingOptionButtons } =
    useMainStore((state) => ({
      playerMetadata: state.playerMetadata,
      currentVotes: state.currentVotes,
      showVotingOptionButtons: state.showVotingOptionButtons,
    }));

  return (
    <motion.div
      key={"miniMobileVotingModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: showVotingOptionButtons ? 0 : 1 }}
      // ^ don't want this to be showing when toast is showing
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex absolute left-4 top-0 z-[200] w-3/4 !justify-start gap-2"
    >
      <div className="countdownTimerMiniMobileModal"></div>
      <p
        style={{
          color: "hsl(120deg 100% 86%)",
        }}
      >
        Vote
      </p>
      <div className="baseFlex w-full max-w-40 gap-4 px-4 py-2">
        {Object.keys(playerMetadata).map((playerID, idx) => {
          return (
            <div
              key={`${playerID}${idx}`}
              style={{
                backgroundColor:
                  currentVotes[idx] !== undefined
                    ? currentVotes[idx] === "agree"
                      ? "#15803d"
                      : "#b91c1c"
                    : "#e2e2e2",
              }}
              className={`h-4 w-full rounded-md ${
                currentVotes[idx] === undefined ? "animate-pulse" : ""
              } transition-colors`}
            ></div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default MiniMobileVotingModal;
