import { useState, useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import cryptoRandomString from "crypto-random-string";
import { trpc } from "../../utils/trpc";
import { useRoomContext } from "../../context/RoomContext";
import { useLocalStorageContext } from "../../context/LocalStorageContext";

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

export interface IPlayerMetadata {
  username: string;
  userID: string;
}

let socket: Socket;

function CreateRoom() {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // add ctx.userID ?? localStorageID.value

  const utils = trpc.useContext();

  const createRoomInDatabase = trpc.rooms.createRoom.useMutation();

  const [hostUserID, setHostUserID] = useState<string>();
  // probably if user isn't logged in, and they don't already have a userID stored
  // in localstorage, then make one for them? use stage useLocalStorage hook for this

  const [roomCreated, setRoomCreated] = useState<boolean>(false);

  useEffect(() => {
    if (userID) setHostUserID(userID);
  }, [userID]);

  useEffect(() => {
    // rough way to check whether context data has been initialized
    if (roomCtx.roomConfig.code === "" && hostUserID) {
      roomCtx.setRoomConfig({
        pointsToWin: 100,
        maxRounds: 3,
        maxPlayers: 4,
        playersInRoom: 1,
        isPublic: true,
        code: cryptoRandomString({ length: 6 }),
        hostUsername: "",
        hostUserID: hostUserID,
      });

      roomCtx.setPlayerMetadata([{ username: "", userID: hostUserID }]);

      socket = io();

      socket.on("roomWasCreated", () => setRoomCreated(true)); // have loading dots while this is waiting?

      socket.on("connectedUsersChanged", (newUsers) =>
        roomCtx?.setPlayerMetadata(newUsers)
      );

      socket.on("roomConfigUpdated", (roomConfig) =>
        roomCtx.setRoomConfig(roomConfig)
      );

      socket.on("navigateToPlayScreen", () => roomCtx?.setPageToRender("play"));
    }

    // maybe you need to have a disconnect function that runs
    // when the component unmounts?
  }, [roomCtx, hostUserID]);

  function createRoom() {
    if (roomCtx && roomCtx.roomConfig) {
      socket.emit("createRoom", roomCtx.roomConfig);
      createRoomInDatabase.mutate(roomCtx.roomConfig);
    }
  }

  function updateRoomConfig(key: string, value: any) {
    // maybe need to store prev value of roomConfig first and ref that? no big deal if yo uahve to
    if (roomCtx === null) return;

    roomCtx.setRoomConfig({ ...roomCtx.roomConfig, [key]: value });
    if (roomCreated) {
      socket.emit("updateRoomConfig", { ...roomCtx.roomConfig, [key]: value });
    }
    // trpc mutation to update room in database
  }

  // if (roomCtx === null) return <></>;

  return (
    <div className="baseVertFlex min-h-[100vh] gap-4 bg-green-700">
      <div className="baseFlex">
        <button
          className="ml-0"
          onClick={() => roomCtx.setPageToRender("home")}
        >
          Back to home
        </button>
        {`${
          roomCreated
            ? `${roomCtx.playerMetadata[0]?.username}'s Room`
            : "Create Room"
        }`}
      </div>
      <div className="baseVertFlex gap-2">
        <div className="baseFlex gap-2">
          <label>Username</label>
          <input
            type="text"
            placeholder="username"
            onChange={(e) => {
              roomCtx.setPlayerMetadata((prevMetadata) => {
                const newMetadata = [...prevMetadata];
                newMetadata[0]!.username = e.target.value;
                return newMetadata;
              });
              updateRoomConfig("hostUsername", e.target.value);
            }}
            value={roomCtx.playerMetadata[0]?.username}
          />
        </div>

        <div className="baseFlex gap-2">
          <label>Points to win:</label>
          <div className="baseFlex gap-2">
            <button
              disabled={roomCtx.roomConfig.pointsToWin <= 50}
              onClick={() =>
                updateRoomConfig(
                  "pointsToWin",
                  roomCtx.roomConfig.pointsToWin - 25
                )
              }
            >
              -10
            </button>
            {roomCtx.roomConfig.pointsToWin}
            <button
              disabled={roomCtx.roomConfig.pointsToWin >= 500}
              onClick={() =>
                updateRoomConfig(
                  "pointsToWin",
                  roomCtx.roomConfig.pointsToWin + 25
                )
              }
            >
              +25
            </button>
          </div>
        </div>

        <div className="baseFlex gap-2">
          <label>Max rounds:</label>
          <div className="baseFlex gap-2">
            <button
              disabled={roomCtx.roomConfig.maxRounds <= 1}
              onClick={() =>
                updateRoomConfig("maxRounds", roomCtx.roomConfig.maxRounds - 1)
              }
            >
              -1
            </button>
            {roomCtx.roomConfig.maxRounds}
            <button
              disabled={roomCtx.roomConfig.maxRounds >= 5}
              onClick={() =>
                updateRoomConfig("maxRounds", roomCtx.roomConfig.maxRounds + 1)
              }
            >
              +1
            </button>
          </div>
        </div>

        <div className="baseFlex gap-2">
          <label>Max players:</label>
          <div className="baseFlex gap-2">
            <button
              disabled={roomCtx.roomConfig.maxPlayers <= 2}
              onClick={() =>
                updateRoomConfig(
                  "maxPlayers",
                  roomCtx.roomConfig.maxPlayers - 1
                )
              }
            >
              -1
            </button>
            {roomCtx.roomConfig.maxPlayers}
            <button
              onClick={() =>
                updateRoomConfig(
                  "maxPlayers",
                  roomCtx.roomConfig.maxPlayers + 1
                )
              }
              disabled={roomCtx.roomConfig.maxPlayers >= 8}
            >
              +1
            </button>
          </div>
        </div>

        <div className="baseFlex gap-2">
          <label>Room visibility:</label>
          <div className="baseFlex">
            <button
              onClick={() => updateRoomConfig("isPublic", true)}
              style={{
                backgroundColor: roomCtx.roomConfig.isPublic
                  ? "rgba(255,255,255,0.5)"
                  : "",
              }}
            >
              Public
            </button>
            <button
              onClick={() => updateRoomConfig("isPublic", false)}
              style={{
                backgroundColor: !roomCtx.roomConfig.isPublic
                  ? "rgba(255,255,255,0.5)"
                  : "",
              }}
            >
              Private
            </button>
          </div>
        </div>

        <div className="baseFlex gap-2">
          <label>Room code:</label>
          <div className="baseFlex gap-2">
            {roomCtx.roomConfig.code}
            <button>Copy room code</button>
          </div>
        </div>

        {roomCreated ? (
          <div className="baseVertFlex gap-2">
            {`Players ${roomCtx.roomConfig?.playersInRoom}/${roomCtx.roomConfig?.maxPlayers}`}
            <div className="baseFlex gap-2">
              {roomCtx.playerMetadata?.map((player) => (
                <div className="baseVertFlex gap-2" key={player.userID}>
                  <div>{player.username}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => socket.emit("startGame", roomCtx.roomConfig.code)}
            >
              Start game
            </button>
          </div>
        ) : (
          <button
            disabled={roomCtx.playerMetadata[0]?.username.length === 0}
            onClick={() => createRoom()}
          >
            Create room
          </button>
        )}
      </div>
    </div>
  );
}

export default CreateRoom;
