import { useState, useEffect } from "react";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useRoomContext } from "../../context/RoomContext";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { IRoomPlayer, type IGameMetadata } from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";
import PlayerIcon from "../playerIcons/PlayerIcon";

function JoinRoom() {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // add ctx.userID ?? localStorageID.value

  const [username, setUsername] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [submittedRoomCode, setSubmittedRoomCode] = useState<string>("");

  const [configAndMetadataInitialized, setConfigAndMetadataInitialized] =
    useState<boolean>(false);

  const { data: receivedRoomConfig } =
    trpc.rooms.findRoomByCode.useQuery(submittedRoomCode);
  // maybe need to have roomCode be in some temp state, and then
  // when you click join room, then it updates the roomCode state -> triggers this query...

  useEffect(() => {
    if (configAndMetadataInitialized || !userID) return;

    roomCtx.setPlayerMetadata({
      ...roomCtx.playerMetadata,
      [userID]: {
        username: "",
        avatarPath: "/avatars/rabbit.svg",
        color: "rgb(220, 55, 76)",
        deckHueRotation: 232,
      } as IRoomPlayer,
    });

    setConfigAndMetadataInitialized(true);
  }, [roomCtx, userID, configAndMetadataInitialized]);

  useEffect(() => {
    // rough way to check whether context data has been initialized
    if (receivedRoomConfig && !roomCtx.connectedToRoom) {
      roomCtx.setRoomConfig(receivedRoomConfig);
      setSubmittedRoomCode("");
      joinRoom();
      roomCtx.setConnectedToRoom(true);
    }
  }, [roomCtx, receivedRoomConfig]);

  useEffect(() => {
    socket.on("playerMetadataUpdated", (newUsers) =>
      roomCtx.setPlayerMetadata(newUsers)
    );

    socket.on("roomConfigUpdated", (roomConfig) =>
      roomCtx.setRoomConfig(roomConfig)
    );

    socket.on("navigateToPlayScreen", () => {
      roomCtx.setGameData({} as IGameMetadata);
      roomCtx.setPageToRender("play");
    });

    return () => {
      socket.off("playerMetadataUpdated", (newUsers) =>
        roomCtx.setPlayerMetadata(newUsers)
      );
      socket.off("roomConfigUpdated", (roomConfig) =>
        roomCtx.setRoomConfig(roomConfig)
      );
      socket.off("navigateToPlayScreen", () => {
        roomCtx.setGameData({} as IGameMetadata);
        roomCtx.setPageToRender("play");
      });
    };
  }, []);
  // might need to add roomCtx to deps here

  function checkRoomCode() {
    setSubmittedRoomCode(roomCode);
  }

  function joinRoom() {
    if (!userID) return;

    socket.emit("joinRoom", {
      userID,
      code: roomCode,
      playerMetadata: {
        ...roomCtx.playerMetadata[userID],
        username: username,
      },
    });
    // trpc update
  }

  return (
    <div className="baseVertFlex min-h-[100vh] gap-4 bg-green-700">
      <button className="ml-0" onClick={() => roomCtx.setPageToRender("home")}>
        Back to home
      </button>
      {!roomCtx.connectedToRoom ? (
        <>
          Join Room
          <div className="baseVertFlex gap-2">
            <div className="baseVertFlex gap-4">
              <div className="baseFlex gap-2">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="username"
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
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
              disabled={username.length === 0 || roomCode.length === 0}
              onClick={() => checkRoomCode()}
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
          {`${Object.values(roomCtx.playerMetadata)[0]?.username}'s room`}

          <fieldset className="rounded-md border-2 border-white p-4">
            <legend className="pl-4 pr-4 text-left text-lg">
              Room settings
            </legend>
            <div className="grid grid-cols-2 grid-rows-5 gap-2 p-4">
              <div>Points to win:</div>
              {roomCtx.roomConfig?.pointsToWin}

              <div>Max rounds:</div>
              {roomCtx.roomConfig?.maxRounds}

              <div>Max players:</div>
              {roomCtx.roomConfig?.maxPlayers}

              <div>Room visibility:</div>
              {roomCtx.roomConfig?.isPublic ? "Public" : "Private"}

              <div>Room code:</div>
              <div className="baseFlex !justify-start gap-2">
                {roomCtx.roomConfig?.code}
                <button>Copy</button>
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-md border-2 border-white p-4">
            <legend className="pl-4 pr-4 text-left text-lg">
              {`Players ${roomCtx.roomConfig?.playersInRoom}/${roomCtx.roomConfig?.maxPlayers}`}
            </legend>
            <div className="baseVertFlex gap-6 p-4">
              <div className="baseFlex gap-8">
                {Object.keys(roomCtx.playerMetadata)?.map((playerID) => (
                  <PlayerIcon
                    key={playerID}
                    avatarPath={
                      roomCtx.playerMetadata[playerID]?.avatarPath ||
                      "/avatars/rabbit.svg"
                    }
                    borderColor={
                      roomCtx.playerMetadata[playerID]?.color ||
                      "rgb(220, 55, 76)"
                    }
                    username={roomCtx.playerMetadata[playerID]?.username}
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
    </div>
  );
}

export default JoinRoom;
