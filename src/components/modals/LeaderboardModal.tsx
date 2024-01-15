import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { trpc } from "../../utils/trpc";
import Radio from "../Buttons/Radio";
import PlayerIcon from "../playerIcons/PlayerIcon";
import SecondaryButton from "../Buttons/SecondaryButton";
import { IoClose, IoStatsChart } from "react-icons/io5";

interface ILeaderboardModal {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const orderValues = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
];

function LeaderboardModal({ setShowModal }: ILeaderboardModal) {
  const { data: leaderboardStats } = trpc.users.getLeaderboardStats.useQuery();

  const [currentlySelectedIndex, setCurrentlySelectedIndex] =
    useState<number>(0);

  const modalRef = useRef(null);

  const [aboveMobileViewportWidth, setAboveMobileViewportWidth] =
    useState<boolean>(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) {
        setAboveMobileViewportWidth(true);
      } else {
        setAboveMobileViewportWidth(false);
      }
    }

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useOnClickOutside({
    ref: modalRef,
    setShowModal,
  });

  return (
    <motion.div
      key={"leaderboardModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex fixed left-0 top-0 z-[200] min-h-[100dvh] min-w-[100vw] bg-black/50"
    >
      <motion.div
        ref={modalRef}
        key={"leaderboardModalInner"}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="baseVertFlex max-h-[90vh] w-[93vw] !justify-start overflow-y-auto rounded-md border-2 border-white shadow-md lg:w-auto"
      >
        {/* combine these classes with above? */}
        <div className="baseVertFlex relative w-full !justify-start gap-8 rounded-md bg-green-800 p-8">
          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseFlex gap-4 text-2xl"
          >
            <IoStatsChart size={"1.5rem"} />
            Leaderboard
          </div>

          <div className="baseVertFlex w-full gap-4">
            <Radio
              values={[
                "Total Squeaks",
                "Average cards left in Squeak pile",
                "Average rank per round",
                "Highest score per round",
                "Total games played",
              ]}
              currentValueIndex={currentlySelectedIndex}
              onClickFunctions={[
                () => setCurrentlySelectedIndex(0),
                () => setCurrentlySelectedIndex(1),
                () => setCurrentlySelectedIndex(2),
                () => setCurrentlySelectedIndex(3),
                () => setCurrentlySelectedIndex(4),
                () => setCurrentlySelectedIndex(5),
              ]}
              orientation={window.innerWidth > 1024 ? "horizontal" : "vertical"}
              minHeight={"4rem"}
            />

            <div
              style={{
                borderColor: "hsl(120deg 100% 86%)",
                color: "hsl(120deg 100% 86%)",
              }}
              className="baseVertFlex min-h-auto lg:min-h-auto mt-4 w-auto !justify-start gap-6 rounded-md border-2 p-4 lg:min-w-[500px]"
            >
              <div
                style={{
                  borderColor: "hsl(120deg 100% 86%)",
                }}
                className="grid w-full grid-cols-3 grid-rows-1 place-items-center border-b-2 font-semibold"
              >
                <p>#</p>
                <p>Player</p>
                <p>Value</p>
              </div>
              {leaderboardStats ? (
                Object.values(leaderboardStats)?.[currentlySelectedIndex]?.map(
                  (player, index) => (
                    <div
                      key={index}
                      className="grid w-full grid-cols-3 grid-rows-1 place-items-center gap-2"
                    >
                      <p className="text-sm lg:text-xl">{orderValues[index]}</p>
                      <div className="baseFlex w-full gap-4 text-center md:!justify-start">
                        {aboveMobileViewportWidth && (
                          <PlayerIcon
                            borderColor={player.color}
                            avatarPath={player.avatarPath}
                            size="2.5rem"
                          />
                        )}
                        <p className="text-sm lg:text-xl">{player.username}</p>
                      </div>
                      <p className="text-sm lg:text-xl">{player.value}</p>
                    </div>
                  )
                )
              ) : (
                <div className="baseFlex h-[420px] w-full">
                  <div
                    style={{
                      width: "4rem",
                      height: "4rem",
                      borderTop: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                      borderRight: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                      borderBottom: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
                      borderLeft: `0.35rem solid hsl(120deg 100% 86%)`,
                    }}
                    className="loadingSpinner"
                  ></div>
                </div>
              )}
            </div>
          </div>

          <SecondaryButton
            icon={<IoClose size={"1.5rem"} />}
            extraPadding={false}
            onClickFunction={() => setShowModal(false)}
            width={"2.25rem"}
            height={"2.25rem"}
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default LeaderboardModal;
