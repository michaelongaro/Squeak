import { useState, useEffect, useCallback } from "react";
import { socket } from "../../pages";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import { trpc } from "../../utils/trpc";
import SecondaryButton from "../Buttons/SecondaryButton";
import { HiOutlineRefresh } from "react-icons/hi";
import Filter from "bad-words";

const filter = new Filter();

function PublicRooms() {
  const userID = useUserIDContext();

  const {
    playerMetadata,
    setConnectedToRoom,
    connectedToRoom,
    setRoomConfig,
    friendData,
  } = useRoomContext();

  const { data: roomInviteIDs } = trpc.users.getUsersFromIDList.useQuery(
    friendData?.roomInviteIDs ?? []
  );

  const { data: publicRooms, refetch } =
    trpc.rooms.getAllAvailableRooms.useQuery(undefined, {
      refetchInterval: 30000,
    });

  const [roomCode, setRoomCode] = useState<string>("");
  const [fetchingNewRooms, setFetchingNewRooms] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const joinRoom = useCallback(() => {
    socket.emit("joinRoom", {
      userID,
      code: roomCode,
      playerMetadata: playerMetadata[userID],
    });

    // if player has invite(s) to this room, remove them
    if (roomInviteIDs) {
      for (const friend of roomInviteIDs) {
        if (friend.roomCode === roomCode) {
          socket.emit("modifyFriendData", {
            action: "acceptRoomInvite",
            initiatorID: userID,
            targetID: friend.id,
            roomCode: roomCode,
            currentRoomIsPublic: true,
          });
        }
      }
    }
  }, [roomCode, userID, playerMetadata, roomInviteIDs]);

  useEffect(() => {
    if (roomCode.length > 0 && !connectedToRoom) {
      joinRoom();
      setConnectedToRoom(true);
    }
  }, [connectedToRoom, setConnectedToRoom, joinRoom, roomCode]);

  return (
    <fieldset className="mt-8 rounded-md border-2 border-white bg-green-800 p-4">
      <legend
        style={{
          color: "hsl(120deg 100% 86%)",
        }}
        className="baseFlex gap-4 pl-4 pr-4 text-left text-lg"
      >
        <div className="baseFlex gap-2">
          <div className="text-xl">Public rooms</div>
          {publicRooms && <div>{`(${publicRooms.length})`}</div>}
        </div>

        <SecondaryButton
          icon={<HiOutlineRefresh size={"1.5rem"} />}
          extraPadding={false}
          width={"3rem"}
          rotateIcon={fetchingNewRooms}
          onClickFunction={() => {
            setFetchingNewRooms(true);
            setTimeout(() => {
              setFetchingNewRooms(false);
              refetch();
            }, 500);
          }}
        />
      </legend>

      {publicRooms ? (
        <>
          {publicRooms.length > 0 ? (
            <div
              style={{
                borderColor: "hsl(120deg 100% 86%)",
              }}
              className="baseVertFlex max-h-[400px] w-full !justify-start rounded-md border-2"
            >
              <div
                style={{
                  backgroundColor: "hsl(120deg 100% 86%)",
                  color: "hsl(120deg 100% 18%)",
                }}
                className="grid w-full grid-cols-3 place-items-center p-4 pr-8 font-medium"
              >
                <div>Owner</div>
                <div>Points to win</div>
                <div>Players</div>
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
                      color: "hsl(120deg 100% 86%)",
                      borderColor: "hsl(120deg 100% 86%)",
                      borderBottomWidth:
                        index === publicRooms.length - 1 ? "0px" : "2px ",
                      borderRadius:
                        index === publicRooms.length - 1
                          ? "0 0 0.375rem 0.375rem"
                          : "none",
                    }}
                    className="relative grid w-auto grid-cols-3 place-items-center border-b-2 p-4 pr-8 lg:w-[600px]"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(-1)}
                  >
                    <div>{room.hostUsername}</div>
                    <div>{room.pointsToWin}</div>
                    <div className="baseFlex gap-2">
                      {room.playersInRoom} / {room.maxPlayers}
                    </div>

                    <div className="absolute right-4 ">
                      <SecondaryButton
                        extraPadding={false} // maybe try other way too
                        disabled={
                          playerMetadata[userID]?.username.length === 0 ||
                          filter.isProfane(
                            playerMetadata[userID]?.username ?? ""
                          )
                        }
                        width={"3.5rem"}
                        height={"2.5rem"}
                        innerText="Join"
                        onClickFunction={() => {
                          setRoomConfig(room);
                          setRoomCode(room.code);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className=" w-auto pb-4 pt-4 text-center text-lg lg:min-w-[658px]"
            >
              No rooms found. Create one or refresh to find more.
            </div>
          )}
        </>
      ) : (
        <div className="baseFlex w-auto py-16 lg:min-w-[600px]">
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderTop: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
              borderRight: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
              borderBottom: `0.35rem solid hsla(120deg, 100%, 86%, 40%)`,
              borderLeft: `0.35rem solid hsl(120deg 100% 86%)`,
            }}
            className="loadingSpinner"
          ></div>
        </div>
      )}
    </fieldset>
  );
}

export default PublicRooms;
