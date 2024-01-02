import { motion } from "framer-motion";

function ResetRoundModal() {
  return (
    <motion.div
      key={"resetRoundModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex absolute left-0 top-0 z-[200] h-full w-full bg-black bg-opacity-60"
    >
      <motion.div
        key={"resetRoundModallInner"}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          backgroundColor: "hsl(120deg, 100%, 86%)",
          color: "hsl(120deg, 100%, 18%)",
        }}
        className="h-fit w-fit rounded-md p-8 pl-16 pr-16 font-medium shadow-md"
      >
        <div className="baseVertFlex gap-4">
          <div>No player has a valid move.</div>

          <div>restarting the round</div>

          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderTop: "0.35rem solid hsla(120deg, 100%, 18%, 40%)",
              borderRight: "0.35rem solid hsla(120deg, 100%, 18%, 40%)",
              borderBottom: "0.35rem solid hsla(120deg, 100%, 18%, 40%)",
              borderLeft: "0.35rem solid hsl(120deg 100% 18%)",
            }}
            className="loadingSpinner"
          ></div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ResetRoundModal;
