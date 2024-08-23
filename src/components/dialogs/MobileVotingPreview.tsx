import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRoomContext } from "~/context/RoomContext";

function MobileVotingPreview() {
  const { playerMetadata, currentVotes, showVotingOptionButtons } =
    useRoomContext();

  const [topValue, setTopValue] = useState<number>(0);

  useEffect(() => {
    function handleResize() {
      const board = document.getElementById("board");

      if (board) {
        setTopValue(board.getBoundingClientRect().top / 4.25);
      }
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <motion.div
      key={"miniMobileVotingDialog"}
      initial={{ opacity: 0 }}
      animate={{ opacity: showVotingOptionButtons ? 0 : 1 }}
      // ^ don't want this to be showing when toast is showing
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        top: `${topValue}px`,
      }}
      className="baseFlex absolute left-4 z-[200] w-3/4 max-w-xl !justify-start gap-2"
    >
      <div className="countdownTimerMobileVotingPreview"></div>
      <p className="text-sm text-lightGreen">Vote</p>

      <div className="baseFlex w-full max-w-64 gap-4 px-4 py-2">
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
              className={`h-3 w-full rounded-md ${
                currentVotes[idx] === undefined ? "animate-pulse" : ""
              } transition-colors`}
            ></div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default MobileVotingPreview;
