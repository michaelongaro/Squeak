import { useState, useEffect, useCallback } from "react";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { type IRoomPlayer, type IGameMetadata } from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";
import PlayerIcon from "../playerIcons/PlayerIcon";
import TopRightControls from "../TopRightControls/TopRightControls";

function JoinRoom() {
  const {
    roomConfig,
    setRoomConfig,
    playerMetadata,
    setPlayerMetadata,
    connectedToRoom,
    setConnectedToRoom,
    setGameData,
    setPageToRender,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const [username, setUsername] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [submittedRoomCode, setSubmittedRoomCode] = useState<string>("");

  const { data: receivedRoomConfig } =
    trpc.rooms.findRoomByCode.useQuery(submittedRoomCode);
  // maybe need to have roomCode be in some temp state, and then
  // when you click join room, then it updates the roomCode state -> triggers this query...

  const joinRoom = useCallback(() => {
    socket.emit("joinRoom", {
      userID,
      code: roomCode,
      playerMetadata: playerMetadata[userID],
    });
    // trpc update
  }, [roomCode, userID, playerMetadata]);

  useEffect(() => {
    // rough way to check whether context data has been initialized
    if (receivedRoomConfig && !connectedToRoom) {
      setRoomConfig(receivedRoomConfig);
      setSubmittedRoomCode("");
      joinRoom();
      setConnectedToRoom(true);
    }
  }, [
    connectedToRoom,
    setConnectedToRoom,
    joinRoom,
    setRoomConfig,
    receivedRoomConfig,
  ]);

  useEffect(() => {
    socket.on("playerMetadataUpdated", (newUsers) =>
      setPlayerMetadata(newUsers)
    );

    socket.on("roomConfigUpdated", (roomConfig) => setRoomConfig(roomConfig));

    socket.on("navigateToPlayScreen", () => {
      setGameData({} as IGameMetadata);
      setPageToRender("play");
    });

    return () => {
      socket.off("playerMetadataUpdated", (newUsers) =>
        setPlayerMetadata(newUsers)
      );
      socket.off("roomConfigUpdated", (roomConfig) =>
        setRoomConfig(roomConfig)
      );
      socket.off("navigateToPlayScreen", () => {
        setGameData({} as IGameMetadata);
        setPageToRender("play");
      });
    };
  }, []);
  // might need to add roomCtx to deps here

  return (
    <div className="baseVertFlex relative min-h-[100vh] gap-4 bg-green-700">
      <button className="ml-0" onClick={() => setPageToRender("home")}>
        Back to home
      </button>
      {!connectedToRoom ? (
        <>
          Join Room
          <div className="baseVertFlex gap-2">
            <div className="baseVertFlex gap-4">
              <div className="baseFlex gap-2">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="username"
                  onChange={(e) => {
                    setPlayerMetadata((prevMetadata) => ({
                      ...prevMetadata,
                      [userID]: {
                        ...prevMetadata[userID],
                        username: e.target.value,
                      } as IRoomPlayer,
                    }));
                  }}
                  value={playerMetadata[userID]?.username}
                />
              </div>

              <div className="baseFlex gap-12">
                <PickerTooltip type={"avatar"} />
                <PickerTooltip type={"color"} />
              </div>

              <div className="baseFlex gap-2">
                <label>Room code</label>
                <input
                  type="text"
                  placeholder="code"
                  onChange={(e) => setRoomCode(e.target.value)}
                  value={roomCode}
                />
              </div>
            </div>

            <button
              disabled={
                playerMetadata[userID]?.username.length === 0 ||
                roomCode.length === 0
              }
              onClick={() => setSubmittedRoomCode(roomCode)}
            >
              Join
            </button>

            <fieldset className="rounded-md border-2 border-white p-4">
              <legend className="pl-4 pr-4 text-left text-lg">
                Public rooms
              </legend>
              {/* <PublicRooms /> */}
            </fieldset>
          </div>
        </>
      ) : (
        <div className="baseVertFlex gap-4">
          {`${Object.values(playerMetadata)[0]?.username}'s room`}

          <fieldset className="rounded-md border-2 border-white p-4">
            <legend className="pl-4 pr-4 text-left text-lg">
              Room settings
            </legend>
            <div className="grid grid-cols-2 grid-rows-5 gap-2 p-4">
              <div>Points to win:</div>
              {roomConfig?.pointsToWin}

              <div>Max rounds:</div>
              {roomConfig?.maxRounds}

              <div>Max players:</div>
              {roomConfig?.maxPlayers}

              <div>Room visibility:</div>
              {roomConfig?.isPublic ? "Public" : "Private"}

              <div>Room code:</div>
              <div className="baseFlex !justify-start gap-2">
                {roomConfig?.code}
                <button>Copy</button>
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-md border-2 border-white p-4">
            <legend className="pl-4 pr-4 text-left text-lg">
              {`Players ${roomConfig?.playersInRoom}/${roomConfig?.maxPlayers}`}
            </legend>
            <div className="baseVertFlex gap-6 p-4">
              <div className="baseFlex gap-8">
                {Object.keys(playerMetadata)?.map((playerID) => (
                  <PlayerIcon
                    key={playerID}
                    avatarPath={
                      playerMetadata[playerID]?.avatarPath ||
                      "/avatars/rabbit.svg"
                    }
                    borderColor={
                      playerMetadata[playerID]?.color || "hsl(352deg, 69%, 61%)"
                    }
                    username={playerMetadata[playerID]?.username}
                    size={"3rem"}
                  />
                ))}
              </div>
              <div className="baseFlex gap-12">
                <PickerTooltip type={"avatar"} />
                <PickerTooltip type={"color"} />
              </div>
              waiting for host to start the game
            </div>
          </fieldset>
        </div>
      )}

      <TopRightControls />
    </div>
  );
}

export default JoinRoom;
