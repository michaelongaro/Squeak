import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { api } from "~/utils/api";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { IoClose, IoStatsChart } from "react-icons/io5";
import { useRoomContext } from "~/context/RoomContext";
import { Button } from "~/components/ui/button";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "~/components/ui/carousel";
import { BiArrowBack } from "react-icons/bi";

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

const leaderboardCategories = [
  "Total Squeaks",
  "Avg. cards left in Squeak pile",
  "Avg. rank per round",
  "Highest score per round",
  "Total games played",
];

function LeaderboardModal({ setShowModal }: ILeaderboardModal) {
  const { data: leaderboardStats } = api.users.getLeaderboardStats.useQuery();

  const { viewportLabel } = useRoomContext();

  const [currentlySelectedIndex, setCurrentlySelectedIndex] =
    useState<number>(0);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCurrentlySelectedIndex(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentlySelectedIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

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
        className="baseVertFlex max-h-[90vh] w-[93vw] !justify-start overflow-hidden rounded-md border-2 border-white shadow-md lg:w-auto"
      >
        {/* combine these classes with above? */}
        <div className="baseVertFlex relative w-full !justify-start gap-8 rounded-md bg-gradient-to-br from-green-800 to-green-850 p-4 tablet:p-8">
          <div className="baseFlex gap-4 text-base font-semibold text-lightGreen sm:text-xl">
            <IoStatsChart size={"1.5rem"} />
            Leaderboard
          </div>

          <div className="baseVertFlex w-full gap-4">
            <div className="baseFlex w-full gap-2">
              <Button
                variant={"secondary"}
                onClick={() =>
                  carouselApi?.scrollTo(carouselApi.selectedScrollSnap() - 1)
                }
                className="size-10 shrink-0 sm:w-14"
              >
                <BiArrowBack className="size-5" />
              </Button>
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  loop: true,
                }}
                className="w-full max-w-[70%] sm:max-w-[400px]"
              >
                <CarouselContent className="baseFlex relative w-full !justify-evenly">
                  {leaderboardCategories.map((name, index) => (
                    <CarouselItem key={name} className="px-0">
                      <p
                        className={`select-none text-center text-lg font-medium text-lightGreen transition-all xs:whitespace-nowrap xs:text-nowrap xs:text-xl ${
                          carouselApi?.selectedScrollSnap() === index
                            ? ""
                            : "opacity-50"
                        }`}
                      >
                        {name}
                      </p>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <Button
                variant={"secondary"}
                onClick={() =>
                  carouselApi?.scrollTo(carouselApi.selectedScrollSnap() + 1)
                }
                className="size-10 shrink-0 sm:w-14"
              >
                <BiArrowBack className="size-5 rotate-180" />
              </Button>
            </div>

            <div className="baseVertFlex mt-4 h-[63dvh] w-full !justify-start gap-4 text-lightGreen xs:max-w-[500px] xs:px-2 sm:gap-6 sm:px-0 lg:max-w-2xl">
              <div
                style={{
                  gridTemplateColumns: viewportLabel.includes("mobile")
                    ? "50px auto 50px"
                    : "1fr 1fr 1fr",
                }}
                className="grid w-full grid-rows-1 place-items-center border-b-2 border-lightGreen font-semibold"
              >
                <p>#</p>
                <p>Player</p>
                <p>Value</p>
              </div>

              <div className="baseVertFlex h-full w-full !justify-start gap-6 overflow-y-auto pb-4 pt-1 text-lightGreen">
                <AnimatePresence mode={"wait"}>
                  {leaderboardStats ? (
                    <>
                      {results && results.length > 0 ? (
                        results?.map((player, index) => (
                          <motion.div
                            key={player.id}
                            layout={"position"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                              gridTemplateColumns: viewportLabel.includes(
                                "mobile",
                              )
                                ? "50px auto 50px"
                                : "1fr 1fr 1fr",
                            }}
                            className="grid w-full grid-rows-1 place-items-center gap-2"
                          >
                            <p className="text-sm lg:text-base">
                              {orderValues[index]}
                            </p>
                            <div className="baseFlex gap-4 lg:max-w-none">
                              <div className="baseFlex w-[2.5rem] scale-90 sm:scale-100">
                                <PlayerIcon
                                  borderColor={player.color}
                                  avatarPath={player.avatarPath}
                                  size={"2.5rem"}
                                />
                              </div>
                              <p className="w-[100px] text-sm lg:text-base">
                                {player.username}
                              </p>
                            </div>

                            <p className="text-sm lg:text-base">
                              {player.value}
                            </p>
                          </motion.div>
                        ))
                      ) : (
                        <p>No results</p>
                      )}
                    </>
                  ) : (
                    <motion.div
                      key={"loading"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="baseFlex h-[420px] w-full"
                    >
                      <div
                        className="inline-block size-16 animate-spin rounded-full border-[2px] border-lightGreen border-t-transparent text-lightGreen"
                        role="status"
                        aria-label="loading"
                      >
                        <span className="sr-only">Loading...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <Button
            variant={"text"}
            size={"icon"}
            className="!absolute right-1 top-1 size-8"
            onClick={() => setShowModal(false)}
          >
            <IoClose size={"1.5rem"} />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default LeaderboardModal;
