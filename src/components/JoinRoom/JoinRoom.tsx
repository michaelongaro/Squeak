import { useState, useEffect } from "react";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useRoomContext } from "../../context/RoomContext";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { type IGameMetadata } from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";

function JoinRoom() {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // add ctx.userID ?? localStorageID.value

  const [username, setUsername] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [submittedRoomCode, setSubmittedRoomCode] = useState<string>("");

  const { data: receivedRoomConfig } =
    trpc.rooms.findRoomByCode.useQuery(submittedRoomCode);
  // maybe need to have roomCode be in some temp state, and then
  // when you click join room, then it updates the roomCode state -> triggers this query...

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
    socket.on("connectedUsersChanged", (newUsers) =>
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
      socket.off("connectedUsersChanged", (newUsers) =>
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
    socket.emit("joinRoom", {
      username,
      userID,
      code: roomCode,
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
            <div className="baseFlex gap-2">
              <label>Username</label>
              <input
                type="text"
                placeholder="username"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
              />
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

            <button
              disabled={username.length === 0 || roomCode.length === 0}
              onClick={() => checkRoomCode()}
            >
              Join
            </button>

            <div className="baseFlex gap-2">Public rooms</div>
          </div>
        </>
      ) : (
        <div className="baseVertFlex gap-2">
          {`${roomCtx.playerMetadata?.[0]?.username}'s room`}
          <div className="baseFlex gap-2">
            <div>Points to win:</div>
            {roomCtx.roomConfig?.pointsToWin}
          </div>
          <div className="baseFlex gap-2">
            <div>Max rounds:</div>
            {roomCtx.roomConfig?.maxRounds}
          </div>
          <div className="baseFlex gap-2">
            <div>Max players:</div>
            {roomCtx.roomConfig?.maxPlayers}
          </div>
          <div className="baseFlex gap-2">
            <div>Room visibility:</div>
            {roomCtx.roomConfig?.isPublic ? "Public" : "Private"}
          </div>
          <div className="baseFlex gap-2">
            <div>Room code:</div>
            {roomCtx.roomConfig?.code}
            <div>Copy</div>
          </div>
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
            waiting for host to start the game
          </div>
        </div>
      )}
    </div>
  );
}

export default JoinRoom;
