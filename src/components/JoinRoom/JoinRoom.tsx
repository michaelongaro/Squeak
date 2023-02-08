import { useState, useEffect, useCallback } from "react";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { type IRoomPlayer, type IGameMetadata } from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";
import PlayerIcon from "../playerIcons/PlayerIcon";
import TopRightControls from "../TopRightControls/TopRightControls";
import SecondaryButton from "../Buttons/SecondaryButton";
import { BiArrowBack } from "react-icons/bi";
import PrimaryButton from "../Buttons/PrimaryButton";
import { MdCopyAll } from "react-icons/md";
import { FiCheck } from "react-icons/fi";

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

  const [roomCode, setRoomCode] = useState<string>("");
  const [submittedRoomCode, setSubmittedRoomCode] = useState<string>("");
  const [showCheckmark, setShowCheckmark] = useState<boolean>(false);

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
    <div className="baseVertFlex relative min-h-[100vh]">
      <div className="baseVertFlex relative gap-2 ">
        <div className="absolute top-0 left-0">
          <SecondaryButton
            icon={<BiArrowBack size={"1.5rem"} />}
            extraPadding={false}
            onClickFunction={() => setPageToRender("home")}
          />
        </div>

        <div className="text-xl text-green-300">
          {`${
            connectedToRoom
              ? `${Object.values(playerMetadata)[0]?.username}'s room`
              : "Join Room"
          }`}
        </div>
        {!connectedToRoom ? (
          <>
            <div
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="baseVertFlex mt-4 gap-4 rounded-md border-2 border-white bg-green-800 p-4"
            >
              <div className="baseFlex w-full !justify-between gap-2">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="username"
                  className=" rounded-sm pl-2 text-green-800"
                  maxLength={16}
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

              <div className="baseFlex w-full !justify-between gap-2">
                <label>Room code</label>
                <input
                  type="text"
                  placeholder="code"
                  className=" rounded-sm pl-2 text-green-800"
                  maxLength={6}
                  onChange={(e) => setRoomCode(e.target.value)}
                  value={roomCode}
                />
              </div>

              <div className="baseFlex gap-12">
                <PickerTooltip type={"avatar"} />
                <PickerTooltip type={"color"} />
              </div>
            </div>

            <PrimaryButton
              innerText={"Join"}
              disabled={
                playerMetadata[userID]?.username.length === 0 ||
                roomCode.length === 0
              }
              onClickFunction={() => setSubmittedRoomCode(roomCode)}
              showLoadingSpinnerOnClick={true}
            />

            <fieldset className="rounded-md border-2 border-white p-4">
              <legend className="pl-4 pr-4 text-left text-lg">
                Public rooms
              </legend>
              {/* <PublicRooms /> */}
            </fieldset>
          </>
        ) : (
          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseVertFlex gap-4"
          >
            <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800  p-4">
              <legend className="pl-4 pr-4 text-left text-lg">
                Room settings
              </legend>
              <div className="grid grid-cols-2 grid-rows-5 items-center gap-x-24 gap-y-0 p-4">
                <div>Points to win:</div>
                {roomConfig?.pointsToWin}

                <div>Max rounds:</div>
                {roomConfig?.maxRounds}

                <div>Players:</div>
                {roomConfig?.maxPlayers}

                <div>Room visibility:</div>
                {roomConfig?.isPublic ? "Public" : "Private"}

                <div>Room code:</div>
                <div className="baseFlex !justify-start gap-2">
                  {roomConfig?.code}
                  <SecondaryButton
                    icon={
                      showCheckmark ? (
                        <FiCheck size={"1.5rem"} />
                      ) : (
                        <MdCopyAll size={"1.5rem"} />
                      )
                    }
                    extraPadding={false}
                    onClickFunction={() => {
                      navigator.clipboard.writeText(roomConfig.code);
                      setShowCheckmark(true);
                      setTimeout(() => setShowCheckmark(false), 1000);
                    }}
                  />
                </div>
              </div>
            </fieldset>
            <fieldset className="rounded-md border-2 border-white bg-green-800 p-4">
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
                        "hsl(352deg, 69%, 61%)"
                      }
                      username={playerMetadata[playerID]?.username}
                      size={"3rem"}
                    />
                  ))}
                </div>

                <div className="h-[2px] w-full rounded-md bg-white"></div>

                <div className="baseFlex gap-12">
                  <PickerTooltip type={"avatar"} />
                  <PickerTooltip type={"color"} />
                </div>
              </div>
            </fieldset>
            waiting for host to start the game
            {/* starting game + spinner */}
          </div>
        )}
      </div>

      <TopRightControls forPlayScreen={false} />
    </div>
  );
}

export default JoinRoom;
