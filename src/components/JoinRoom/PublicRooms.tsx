import { useState } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import { api } from "~/utils/api";
import { HiOutlineRefresh } from "react-icons/hi";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { Button } from "~/components/ui/button";
import { FaUsers } from "react-icons/fa";
import { BiArrowBack } from "react-icons/bi";
import { type IRoomConfig } from "~/pages/create";
import { TbCards } from "react-icons/tb";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";

const obscenityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

function PublicRooms() {
  const userID = useUserIDContext();
  const { push } = useRouter();

  const {
    playerMetadata,
    setConnectedToRoom,
    setRoomConfig,
    friendData,
    viewportLabel,
  } = useRoomContext();

  const { data: roomInviteIDs } = api.users.getUsersFromIDList.useQuery(
    friendData?.roomInviteIDs ?? [],
  );

  const {
    data: publicRooms,
    refetch,
    isFetching,
  } = api.rooms.getAllAvailableRooms.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const [fetchingNewRooms, setFetchingNewRooms] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [showExitRoomSpinnerIndex, setShowExitRoomSpinnerIndex] =
    useState<number>(-1);

  function joinRoom(roomConfig: IRoomConfig) {
    setRoomConfig(roomConfig);

    socket.volatile.emit(
      "joinRoom",
      {
        userID,
        code: roomConfig.code,
        playerMetadata: playerMetadata[userID],
      },
      (response?: "roomIsFull") => {
        if (response !== "roomIsFull") {
          setConnectedToRoom(true);
          push(`join/${roomConfig.code}`);
        }
      },
    );

    // if player has invite(s) to this room, remove them
    if (roomInviteIDs) {
      for (const friend of roomInviteIDs) {
        if (friend.roomCode === roomConfig.code) {
          socket.volatile.emit("modifyFriendData", {
            action: "acceptRoomInvite",
            initiatorID: userID,
            targetID: friend.id,
            roomCode: roomConfig.code,
            currentRoomIsPublic: true,
          });
        }
      }
    }
  }

  return (
    <motion.fieldset
      layout={"size"}
      className="mt-8 w-[360px] rounded-md border-2 border-white p-2 sm:w-full sm:p-4"
    >
      <legend className="baseFlex gap-4 pl-4 pr-4 text-left text-lg text-lightGreen">
        <div className="baseFlex gap-2 whitespace-nowrap">
          <div className="text-base sm:text-xl">Public rooms</div>
          {publicRooms && <div>{`(${publicRooms.length})`}</div>}
        </div>

        <Button
          variant={"secondary"}
          onClick={() => {
            setFetchingNewRooms(true);
            setTimeout(() => {
              setFetchingNewRooms(false);
              refetch();
            }, 500);
          }}
          className="absolute -top-2 -mb-4 gap-2 !px-4 text-sm !font-medium"
        >
          Refresh
          <HiOutlineRefresh
            size={"1.5rem"}
            style={{
              transform:
                isFetching || fetchingNewRooms
                  ? "rotate(540deg)"
                  : "rotate(0deg)",
              transition: "transform 0.5s ease-in-out",
            }}
          />
        </Button>
      </legend>

      <AnimatePresence mode="wait">
        {publicRooms ? (
          <>
            {publicRooms.length > 0 ? (
              <motion.div
                key={"publicRoomsFound"}
                initial={{ opacity: 0, height: "176px" }} // height of loading spinner
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: "176px" }} // height of loading spinner
                transition={{ duration: 0.5 }}
                className="baseVertFlex mt-2 max-h-[400px] w-full !justify-start rounded-md border-2 border-lightGreen sm:mt-0"
              >
                <div className="grid w-full grid-cols-3 place-items-center bg-lightGreen p-4 pl-2 pr-10 text-sm font-semibold text-darkGreen sm:text-base">
                  <div>Owner</div>
                  <div>Points to win</div>
                  {viewportLabel.includes("mobile") ? (
                    <FaUsers className="size-5" />
                  ) : (
                    <div>Players</div>
                  )}
                </div>

                <div className="h-full w-full overflow-y-auto">
                  {publicRooms.map((room, index) => (
                    <div
                      key={room.code}
                      style={{
                        backgroundColor:
                          hoveredIndex === index
                            ? "hsl(120deg 100% 18%)"
                            : "hsl(120deg 100% 15%)",
                        borderBottomWidth:
                          index === publicRooms.length - 1 ? "0px" : "2px ",
                        borderRadius:
                          index === publicRooms.length - 1
                            ? "0 0 0.375rem 0.375rem"
                            : "none",
                      }}
                      className="relative grid w-auto grid-cols-3 place-items-center border-b-2 border-darkGreen p-4 pl-2 pr-10 text-lightGreen transition-colors lg:w-[600px]"
                      onPointerEnter={() => setHoveredIndex(index)}
                      onPointerLeave={() => setHoveredIndex(-1)}
                    >
                      <div className="max-w-24 truncate sm:max-w-full tablet:max-w-none">
                        {room.hostUsername}
                      </div>
                      <div>{room.pointsToWin}</div>
                      <div className="baseFlex gap-2">
                        {room.playersInRoom} / {room.maxPlayers}
                      </div>

                      <div className="absolute right-2 sm:right-4">
                        <Button
                          variant={"secondary"}
                          disabled={
                            playerMetadata[userID]?.username.length === 0 ||
                            obscenityMatcher.hasMatch(
                              playerMetadata[userID]?.username ?? "",
                            ) ||
                            showExitRoomSpinnerIndex !== -1
                          }
                          className="w-[40px] !px-2 text-sm tablet:w-[49px]"
                          onClick={() => {
                            setShowExitRoomSpinnerIndex(index);

                            setTimeout(() => {
                              joinRoom(room);
                            }, 500);
                          }}
                        >
                          <AnimatePresence mode={"popLayout"} initial={false}>
                            {showExitRoomSpinnerIndex === index ? (
                              <motion.div
                                key={"exitRoomSpinner"}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.25 }}
                                className="baseFlex"
                              >
                                <div
                                  className="inline-block size-4 animate-spin rounded-full border-[2px] border-lightGreen/25 border-t-transparent text-lightGreen"
                                  role="status"
                                  aria-label="loading"
                                >
                                  <span className="sr-only">Loading...</span>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key={"returnHomeButton"}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.25 }}
                                className="baseFlex"
                              >
                                {viewportLabel.includes("mobile") ? (
                                  <BiArrowBack
                                    size={"1rem"}
                                    className="rotate-180"
                                  />
                                ) : (
                                  "Join"
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={"noRoomsFound"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="baseVertFlex w-full py-4 text-lightGreen lg:min-w-[604px]" // 604px is width of table of rooms found so there isn't any layout shift when switching between states
              >
                <TbCards className="size-16 text-lightGreen" />
                <div className="baseVertFlex mt-4 w-full gap-2">
                  <p className="font-semibold">No rooms found.</p>
                </div>
                <div className="baseFlex w-full gap-2">
                  <Button
                    variant={"text"}
                    onClick={() => push("/create")}
                    className="!p-0 underline underline-offset-2"
                  >
                    Create one
                  </Button>
                  <p>or refresh to find more.</p>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            key={"loading"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="baseFlex w-auto py-16 lg:min-w-[604px]"
          >
            <div
              className="inline-block size-12 animate-spin rounded-full border-[2px] border-lightGreen border-t-transparent text-lightGreen"
              role="status"
              aria-label="loading"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.fieldset>
  );
}

export default PublicRooms;
