import { useState, useEffect } from "react";
import cryptoRandomString from "crypto-random-string";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { type IRoomPlayer, type IGameMetadata } from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";
import PlayerIcon from "../playerIcons/PlayerIcon";

export interface IRoomConfig {
  pointsToWin: number;
  maxRounds: number;
  maxPlayers: number;
  playersInRoom: number;
  isPublic: boolean;
  code: string;
  hostUsername: string;
  hostUserID: string;
}

function CreateRoom() {
  const roomCtx = useRoomContext();
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

  const utils = trpc.useContext();

  const createRoomInDatabase = trpc.rooms.createRoom.useMutation();

  const [configAndMetadataInitialized, setConfigAndMetadataInitialized] =
    useState<boolean>(false);

  useEffect(() => {
    if (!configAndMetadataInitialized && userID) {
      setRoomConfig({
        pointsToWin: 100,
        maxRounds: 3,
        maxPlayers: 4,
        playersInRoom: 1,
        isPublic: true,
        code: cryptoRandomString({ length: 6 }),
        hostUsername: "",
        hostUserID: userID,
      });

      // I think it should be set to saved values if signed in,
      // otherwise default to this:

      setPlayerMetadata({
        ...playerMetadata,
        [userID]: {
          username: "",
          avatarPath: "/avatars/rabbit.svg",
          color: "rgb(220, 55, 76)",
          deckHueRotation: 232,
        } as IRoomPlayer,
      });

      setConfigAndMetadataInitialized(true);
    }
  }, [roomCtx, userID, configAndMetadataInitialized]);

  useEffect(() => {
    socket.on("roomWasCreated", () => setConnectedToRoom(true)); // have loading dots while this is waiting?

    socket.on("playerMetadataUpdated", (newUsers) => {
      console.log("received new data", newUsers);

      setPlayerMetadata(newUsers);
    });

    socket.on("roomConfigUpdated", (roomConfig) => setRoomConfig(roomConfig));

    socket.on("navigateToPlayScreen", () => setPageToRender("play"));

    return () => {
      socket.off("roomWasCreated", () => setConnectedToRoom(true));
      socket.off("playerMetadataUpdated", (newUsers) =>
        setPlayerMetadata(newUsers)
      );
      socket.off("roomConfigUpdated", (roomConfig) =>
        setRoomConfig(roomConfig)
      );
      socket.off("navigateToPlayScreen", () => setPageToRender("play"));
    };
  }, []);
  // might need to add roomCtx to deps here

  function createRoom() {
    if (roomConfig && userID) {
      setConnectedToRoom(true);

      socket.emit("createRoom", roomConfig, playerMetadata[userID]);
      createRoomInDatabase.mutate(roomConfig);
    }
  }

  function updateRoomConfig(key: string, value: any) {
    setRoomConfig({ ...roomConfig, [key]: value });
    if (connectedToRoom) {
      socket.emit("updateRoomConfig", {
        ...roomConfig,
        [key]: value,
      });
    }
    // trpc mutation to update room in database
  }

  return (
    <>
      {userID && (
        <div className="baseVertFlex min-h-[100vh] gap-4 bg-green-700">
          <div className="baseFlex">
            <button className="ml-0" onClick={() => setPageToRender("home")}>
              Back to home
            </button>
            {`${
              connectedToRoom
                ? `${Object.values(playerMetadata)[0]?.username}'s room`
                : "Create Room"
            }`}
          </div>
          <div className="baseVertFlex gap-2">
            {!connectedToRoom && (
              <div className="baseVertFlex gap-4">
                <div className="baseFlex gap-2">
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="username"
                    onChange={(e) => {
                      setPlayerMetadata((prevMetadata) => {
                        const newMetadata = { ...prevMetadata };
                        const user = newMetadata[userID];
                        if (user) {
                          user.username = e.target.value;
                        }

                        return newMetadata;
                      });
                      updateRoomConfig("hostUsername", e.target.value);
                    }}
                    value={playerMetadata[0]?.username}
                  />
                </div>

                <div className="baseFlex gap-12">
                  <PickerTooltip type={"avatar"} />
                  <PickerTooltip type={"color"} />
                </div>
              </div>
            )}

            <fieldset className="rounded-md border-2 border-white p-4">
              <legend className="pl-4 pr-4 text-left text-lg">
                Room settings
              </legend>

              <div className="grid grid-cols-2 grid-rows-5 gap-2 p-4">
                <label>Points to win:</label>
                <div className="baseFlex gap-2">
                  <button
                    disabled={roomConfig.pointsToWin <= 50}
                    onClick={() =>
                      updateRoomConfig(
                        "pointsToWin",
                        roomConfig.pointsToWin - 25
                      )
                    }
                  >
                    -10
                  </button>
                  {roomConfig.pointsToWin}
                  <button
                    disabled={roomConfig.pointsToWin >= 500}
                    onClick={() =>
                      updateRoomConfig(
                        "pointsToWin",
                        roomConfig.pointsToWin + 25
                      )
                    }
                  >
                    +25
                  </button>
                </div>

                <label>Max rounds:</label>
                <div className="baseFlex gap-2">
                  <button
                    disabled={roomConfig.maxRounds <= 1}
                    onClick={() =>
                      updateRoomConfig("maxRounds", roomConfig.maxRounds - 1)
                    }
                  >
                    -1
                  </button>
                  {roomConfig.maxRounds}
                  <button
                    disabled={roomConfig.maxRounds >= 5}
                    onClick={() =>
                      updateRoomConfig("maxRounds", roomConfig.maxRounds + 1)
                    }
                  >
                    +1
                  </button>
                </div>

                <label>Max players:</label>
                <div className="baseFlex gap-2">
                  <button
                    disabled={roomConfig.maxPlayers <= 2}
                    onClick={() =>
                      updateRoomConfig("maxPlayers", roomConfig.maxPlayers - 1)
                    }
                  >
                    -1
                  </button>
                  {roomConfig.maxPlayers}
                  <button
                    onClick={() =>
                      updateRoomConfig("maxPlayers", roomConfig.maxPlayers + 1)
                    }
                    disabled={roomConfig.maxPlayers >= 8}
                  >
                    +1
                  </button>
                </div>

                <label>Room visibility:</label>
                <div className="baseFlex gap-2">
                  <button
                    onClick={() => updateRoomConfig("isPublic", true)}
                    style={{
                      backgroundColor: roomConfig.isPublic
                        ? "rgba(255,255,255,0.5)"
                        : "",
                    }}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => updateRoomConfig("isPublic", false)}
                    style={{
                      backgroundColor: !roomConfig.isPublic
                        ? "rgba(255,255,255,0.5)"
                        : "",
                    }}
                  >
                    Private
                  </button>
                </div>

                <label>Room code:</label>
                <div className="baseFlex gap-2">
                  {roomConfig.code}
                  <button>Copy room code</button>
                </div>
              </div>
            </fieldset>

            {connectedToRoom ? (
              <div className="baseVertFlex gap-4">
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
                            playerMetadata[playerID]?.color ||
                            "rgb(220, 55, 76)"
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
                  </div>
                </fieldset>

                <button
                  onClick={() => {
                    setGameData({} as IGameMetadata);

                    socket.emit("startGame", {
                      roomCode: roomConfig.code,
                      firstRound: true,
                    });
                  }}
                >
                  Start game
                </button>
              </div>
            ) : (
              <button
                disabled={playerMetadata[0]?.username.length === 0}
                onClick={() => createRoom()}
              >
                Create room
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CreateRoom;
