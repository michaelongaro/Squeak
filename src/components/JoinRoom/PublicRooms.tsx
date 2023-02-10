import { useState, useEffect, useCallback } from "react";
import { socket } from "../../pages";
import { ImEnter } from "react-icons/im";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { trpc } from "../../utils/trpc";
import SecondaryButton from "../Buttons/SecondaryButton";
import { HiOutlineRefresh } from "react-icons/hi";
import Filter from "bad-words";

const filter = new Filter();

function PublicRooms() {
  const { setRoomConfig, playerMetadata, connectedToRoom, setConnectedToRoom } =
    useRoomContext();
  const { value: userID } = useUserIDContext();
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
    // trpc update
  }, [roomCode, userID, playerMetadata]);

  useEffect(() => {
    if (roomCode.length > 0 && !connectedToRoom) {
      joinRoom();
      setConnectedToRoom(true);
    }
  }, [connectedToRoom, setConnectedToRoom, joinRoom, roomCode]);

  // alternating light and dark, maybe just have hover over darken it a bit (brightness(0.85))
  return (
    <fieldset className="rounded-md border-2 border-white bg-green-800 p-4">
      <legend
        style={{
          color: "hsl(120deg 100% 86%)",
        }}
        className="baseFlex gap-4 pl-4 pr-4 text-left text-lg"
      >
        <div className="baseFlex gap-2">
          <div className="text-xl">Public rooms</div>
          <div>{`(${publicRooms?.length})`}</div>
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

      <div
        style={{
          borderColor: "hsl(120deg 100% 86%)",
        }}
        className="baseVertFlex max-h-[400px] w-full !justify-start rounded-md border-2 "
      >
        <div
          style={{
            backgroundColor: "hsl(120deg 100% 86%)",
            color: "hsl(120deg 100% 18%)",
          }}
          className="grid w-[618px] grid-cols-3 place-items-center p-4 pr-12"
        >
          <div>Name</div>
          <div>Points to win</div>
          <div>Players</div>
        </div>

        <div className="h-full w-full overflow-y-scroll">
          {publicRooms?.map((room, index) => (
            <div
              key={room.code}
              style={{
                backgroundColor: "hsl(120deg 100% 18%)",
                color: "hsl(120deg 100% 86%)",
                borderColor: "hsl(120deg 100% 86%)",
                filter:
                  hoveredIndex === index ? "brightness(1.15)" : "brightness(1)",
                transition: "all 0.1s ",
              }}
              className="relative grid w-[600px] grid-cols-3 place-items-center border-b-2 p-4 pr-8 "
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
                  // maybe add "join" to the button text
                  extraPadding={false} // maybe try other way too
                  disabled={
                    playerMetadata[userID]?.username.length === 0 ||
                    filter.isProfane(playerMetadata[userID]?.username ?? "")
                  }
                  width={"3.5rem"}
                  height={"2.5rem"}
                  icon={<ImEnter size={"1.5rem"} />}
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
    </fieldset>
  );
}

export default PublicRooms;