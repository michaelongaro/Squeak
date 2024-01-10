import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function DecksAreBeingRotatedModal() {
  const [absolutePositionOfInnerTooltip, setAbsolutePositionOfInnerTooltip] =
    useState<{
      left: string;
      top: string;
    } | null>(null);

  useEffect(() => {
    const playerContainer = document.getElementById("playerContainer");

    if (!playerContainer) return;

    const playerContainerRect = playerContainer.getBoundingClientRect();

    // TODO: convert this to appropriate offsets for mobile view when doing that refactor
    setAbsolutePositionOfInnerTooltip({
      left: `${playerContainerRect.left - 150}px`,
      top: `${playerContainerRect.top + 119}px`,
    });
  }, []);

  return (
    <motion.div
      key={"decksAreBeingRotatedModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex absolute left-0 top-0 z-[200] h-full w-full bg-black bg-opacity-60"
    >
      {absolutePositionOfInnerTooltip && (
        <motion.div
          key={"decksAreBeingRotatedModalInner"}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            backgroundColor: "hsl(120deg, 100%, 86%)",
            color: "hsl(120deg, 100%, 18%)",
            left: absolutePositionOfInnerTooltip.left,
            top: absolutePositionOfInnerTooltip.top,
          }}
          className="baseVertFlex absolute gap-2 rounded-sm border-2 bg-green-800 p-2"
        >
          <div>No player has valid moves,</div>
          <div>rotating each player&apos;s deck by one card.</div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default DecksAreBeingRotatedModal;
