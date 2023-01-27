import { useState, useEffect } from "react";
import cryptoRandomString from "crypto-random-string";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useRoomContext } from "../../context/RoomContext";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import {
  IPlayerCardsMetadata,
  IRoomPlayer,
  IRoomPlayersMetadata,
  type IGameMetadata,
} from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";

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
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // add ctx.userID ?? localStorageID.value

  const utils = trpc.useContext();

  const createRoomInDatabase = trpc.rooms.createRoom.useMutation();

  useEffect(() => {
    // rough way to check whether context data has been initialized
    if (roomCtx.roomConfig.code === "" && userID) {
      roomCtx.setRoomConfig({
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

      roomCtx.setPlayerMetadata({
        ...roomCtx.playerMetadata,
        [userID]: {
          username: "",
          avatarPath: "/avatars/rabbit.svg",
          color: "rgb(220, 55, 76)",
          deckHueRotation: 232,
        } as IRoomPlayer,
      });
    }
  }, [roomCtx, userID]);

  useEffect(() => {
    socket.on("roomWasCreated", () => roomCtx.setConnectedToRoom(true)); // have loading dots while this is waiting?

    socket.on("connectedUsersChanged", (newUsers) =>
      roomCtx?.setPlayerMetadata(newUsers)
    );

    socket.on("roomConfigUpdated", (roomConfig) =>
      roomCtx.setRoomConfig(roomConfig)
    );

    socket.on("navigateToPlayScreen", () => roomCtx?.setPageToRender("play"));
  }, []);
  // might need to add roomCtx to deps here

  function createRoom() {
    if (roomCtx && roomCtx.roomConfig) {
      roomCtx.setConnectedToRoom(true);

      socket.emit("createRoom", roomCtx.roomConfig);
      createRoomInDatabase.mutate(roomCtx.roomConfig);
    }
  }

  function updateRoomConfig(key: string, value: any) {
    roomCtx.setRoomConfig({ ...roomCtx.roomConfig, [key]: value });
    if (roomCtx.connectedToRoom) {
      socket.emit("updateRoomConfig", {
        ...roomCtx.roomConfig,
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
            <button
              className="ml-0"
              onClick={() => roomCtx.setPageToRender("home")}
            >
              Back to home
            </button>
            {`${
              roomCtx.connectedToRoom
                ? `${roomCtx.playerMetadata[0]?.username}'s Room`
                : "Create Room"
            }`}
          </div>
          <div className="baseVertFlex gap-2">
            {!roomCtx.connectedToRoom && (
              <div className="baseFlex gap-2">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="username"
                  onChange={(e) => {
                    roomCtx.setPlayerMetadata((prevMetadata) => {
                      const newMetadata = { ...prevMetadata };
                      const user = newMetadata[userID];
                      if (user) {
                        user.username = e.target.value;
                      }

                      return newMetadata;
                    });
                    updateRoomConfig("hostUsername", e.target.value);
                  }}
                  value={roomCtx.playerMetadata[0]?.username}
                />
              </div>
            )}

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
                    updateRoomConfig(
                      "maxRounds",
                      roomCtx.roomConfig.maxRounds - 1
                    )
                  }
                >
                  -1
                </button>
                {roomCtx.roomConfig.maxRounds}
                <button
                  disabled={roomCtx.roomConfig.maxRounds >= 5}
                  onClick={() =>
                    updateRoomConfig(
                      "maxRounds",
                      roomCtx.roomConfig.maxRounds + 1
                    )
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

            {roomCtx.connectedToRoom ? (
              <div className="baseVertFlex gap-2">
                {`Players ${roomCtx.roomConfig?.playersInRoom}/${roomCtx.roomConfig?.maxPlayers}`}
                <div className="baseFlex gap-2">
                  {Object.keys(roomCtx.playerMetadata)?.map((playerID) => (
                    <div className="baseVertFlex gap-2" key={playerID}>
                      <div>{roomCtx.playerMetadata[playerID]?.username}</div>
                    </div>
                  ))}
                </div>

                <div className="baseFlex gap-4">
                  <PickerTooltip type={"avatar"} />
                  <PickerTooltip type={"deck"} />
                </div>

                <button
                  onClick={() => {
                    roomCtx.setGameData({} as IGameMetadata);

                    socket.emit("startGame", {
                      roomCode: roomCtx.roomConfig.code,
                      firstRound: true,
                    });
                  }}
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
      )}
    </>
  );
}

export default CreateRoom;
