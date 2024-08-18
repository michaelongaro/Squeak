import { useState } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import { api } from "~/utils/api";
import { HiOutlineRefresh } from "react-icons/hi";
import Filter from "bad-words";
import { Button } from "~/components/ui/button";
import { FaUsers } from "react-icons/fa";
import { BiArrowBack } from "react-icons/bi";
import { type IRoomConfig } from "~/pages/create";
import { useRouter } from "next/router";

const filter = new Filter();

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
    <fieldset className="mt-8 w-[360px] rounded-md border-2 border-white p-2 sm:w-full sm:p-4">
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
          className="gap-2 !px-4 text-sm !font-medium"
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

      {publicRooms ? (
        <>
          {publicRooms.length > 0 ? (
            <div className="baseVertFlex mt-2 max-h-[400px] w-full !justify-start rounded-md border-2 border-lightGreen sm:mt-0">
              <div className="grid w-full grid-cols-3 place-items-center bg-lightGreen p-4 pr-8 text-sm font-medium text-darkGreen sm:text-base">
                <div>Owner</div>
                <div>Points to win</div>
                {viewportLabel.includes("mobile") ? (
                  <FaUsers size={"1rem"} />
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
                    className="relative grid w-auto grid-cols-3 place-items-center border-b-2 border-darkGreen p-4 pr-8 text-lightGreen transition-colors lg:w-[600px]"
                    onPointerEnter={() => setHoveredIndex(index)}
                    onPointerLeave={() => setHoveredIndex(-1)}
                  >
                    <div className="max-w-24 truncate sm:max-w-full">
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
                          filter.isProfane(
                            playerMetadata[userID]?.username ?? "",
                          )
                        }
                        className="!px-2 text-sm"
                        onClick={() => joinRoom(room)}
                      >
                        {viewportLabel.includes("mobile") ? (
                          <BiArrowBack size={"1rem"} className="rotate-180" />
                        ) : (
                          "Join"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="baseFlex w-full py-4 text-base text-lightGreen sm:text-lg lg:min-w-[658px]">
              <p className="w-3/4 text-center sm:w-full">
                No rooms found. Create one or refresh to find more.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="baseFlex w-auto py-16 lg:min-w-[600px]">
          <div
            className="inline-block size-12 animate-spin rounded-full border-[2px] border-lightGreen border-t-transparent text-lightGreen"
            role="status"
            aria-label="loading"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
    </fieldset>
  );
}

export default PublicRooms;
