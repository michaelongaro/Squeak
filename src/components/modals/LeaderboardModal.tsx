import { useState, useRef } from "react";
import { motion } from "framer-motion";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { api } from "~/utils/api";
import Radio from "../Buttons/Radio";
import PlayerIcon from "../playerIcons/PlayerIcon";
import SecondaryButton from "../Buttons/SecondaryButton";
import { IoClose, IoStatsChart } from "react-icons/io5";
import { useRoomContext } from "~/context/RoomContext";

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
  const { data: leaderboardStats } = api.users.getLeaderboardStats.useQuery();

  const { viewportLabel } = useRoomContext();

  const [currentlySelectedIndex, setCurrentlySelectedIndex] =
    useState<number>(0);

  const modalRef = useRef(null);

  useOnClickOutside({
    ref: modalRef,
    setShowModal,
  });

  const results = Object.values(leaderboardStats || {})?.[
    currentlySelectedIndex
  ];

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
        <div className="baseVertFlex relative w-full !justify-start gap-8 rounded-md bg-gradient-to-br from-green-800 to-green-850 p-4 tablet:p-8">
          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseFlex gap-4 pt-4 text-base font-semibold sm:text-xl md:pt-2"
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
              forMobileLeaderboard={viewportLabel.includes("mobile")}
              minHeight={"4rem"}
            />

            <div
              style={{
                borderColor: "hsl(120deg 100% 86%)",
                color: "hsl(120deg 100% 86%)",
              }}
              className="baseVertFlex mt-4 h-[63dvh] w-auto !justify-start gap-6 rounded-md border-2 p-4 lg:min-w-[500px]"
            >
              <div
                style={{
                  borderColor: "hsl(120deg 100% 86%)",
                  gridTemplateColumns: viewportLabel.includes("mobile")
                    ? "50px auto 50px"
                    : "1fr 1fr 1fr",
                }}
                className="grid w-full grid-rows-1 place-items-center border-b-2 font-semibold"
              >
                <p>#</p>
                <p>Player</p>
                <p>Value</p>
              </div>
              {leaderboardStats ? (
                <>
                  {results && results.length > 0 ? (
                    results?.map((player, index) => (
                      <div
                        key={index}
                        style={{
                          gridTemplateColumns: viewportLabel.includes("mobile")
                            ? "50px auto 50px"
                            : "1fr 1fr 1fr",
                        }}
                        className="grid w-full grid-rows-1 place-items-center gap-2"
                      >
                        <p className="text-sm lg:text-xl">
                          {orderValues[index]}
                        </p>
                        <div className="baseFlex w-full !justify-start gap-4">
                          <div className="scale-90 sm:scale-100">
                            <PlayerIcon
                              borderColor={player.color}
                              avatarPath={player.avatarPath}
                              size={"2.5rem"}
                            />
                          </div>
                          <p className="text-sm lg:text-xl">
                            {player.username}
                          </p>
                        </div>
                        <p className="text-sm lg:text-xl">{player.value}</p>
                      </div>
                    ))
                  ) : (
                    <p>No results</p>
                  )}
                </>
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
