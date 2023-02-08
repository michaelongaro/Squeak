import { useState, useEffect } from "react";
import cryptoRandomString from "crypto-random-string";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { type IRoomPlayer, type IGameMetadata } from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";
import PlayerIcon from "../playerIcons/PlayerIcon";
import TopRightControls from "../TopRightControls/TopRightControls";
import SecondaryButton from "../Buttons/SecondaryButton";
import Radio from "../Buttons/Radio";
import { MdCopyAll } from "react-icons/md";
import PrimaryButton from "../Buttons/PrimaryButton";
import { BiArrowBack } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";

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

  const createRoomInDatabase = trpc.rooms.createRoom.useMutation();

  const [configAndMetadataInitialized, setConfigAndMetadataInitialized] =
    useState<boolean>(false);
  const [showCheckmark, setShowCheckmark] = useState<boolean>(false);

  useEffect(() => {
    if (!configAndMetadataInitialized && userID) {
      setRoomConfig((prevRoomConfig) => ({
        ...prevRoomConfig,
        code: cryptoRandomString({ length: 6 }),
        hostUsername: playerMetadata[userID]?.username || "",
        hostUserID: userID,
      }));

      setConfigAndMetadataInitialized(true);
    }
  }, [playerMetadata, setRoomConfig, userID, configAndMetadataInitialized]);

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
              : "Create Room"
          }`}
        </div>

        {!connectedToRoom && (
          <div className="baseVertFlex mt-4 gap-4 rounded-md border-2 border-white bg-green-800 p-4">
            <div className="baseFlex gap-2">
              <label
                style={{
                  color: "hsl(120deg 100% 86%)",
                }}
              >
                Username
              </label>
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
                  updateRoomConfig("hostUsername", e.target.value);
                }}
                value={playerMetadata[userID]?.username}
              />
            </div>

            <div className="baseFlex gap-12">
              <PickerTooltip type={"avatar"} />
              <PickerTooltip type={"color"} />
            </div>
          </div>
        )}

        <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800 p-4">
          <legend
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="pl-4 pr-4 text-left text-lg"
          >
            Room settings
          </legend>

          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="grid grid-cols-2 grid-rows-5 items-center gap-2 p-4"
          >
            <label>Points to win:</label>
            <div className=" baseFlex !justify-between gap-2 pl-4 pr-4">
              <SecondaryButton
                innerText={"-25"}
                disabled={roomConfig.pointsToWin <= 50}
                extraPadding={false}
                width={"3rem"}
                height={"3rem"}
                onClickFunction={() =>
                  updateRoomConfig("pointsToWin", roomConfig.pointsToWin - 25)
                }
              />

              <div className=" text-green-300">{roomConfig.pointsToWin}</div>

              <SecondaryButton
                innerText={"+25"}
                disabled={roomConfig.pointsToWin >= 500}
                extraPadding={false}
                width={"3rem"}
                height={"3rem"}
                onClickFunction={() =>
                  updateRoomConfig("pointsToWin", roomConfig.pointsToWin + 25)
                }
              />
            </div>

            <label>Max rounds:</label>
            <div className="baseFlex !justify-between gap-2 pl-4 pr-4">
              <SecondaryButton
                innerText={"-1"}
                disabled={roomConfig.maxRounds <= 1}
                extraPadding={false}
                width={"3rem"}
                height={"3rem"}
                onClickFunction={() =>
                  updateRoomConfig("maxRounds", roomConfig.maxRounds - 1)
                }
              />

              <div className=" text-green-300">{roomConfig.maxRounds}</div>

              <SecondaryButton
                innerText={"+1"}
                disabled={roomConfig.maxRounds >= 5}
                extraPadding={false}
                width={"3rem"}
                height={"3rem"}
                onClickFunction={() =>
                  updateRoomConfig("maxRounds", roomConfig.maxRounds + 1)
                }
              />
            </div>

            <label>Players:</label>

            <Radio
              values={[2, 3, 4]}
              onClickFunctions={[
                () => updateRoomConfig("maxPlayers", 2),
                () => updateRoomConfig("maxPlayers", 3),
                () => updateRoomConfig("maxPlayers", 4),
              ]}
            />

            <label>Room visibility:</label>
            <Radio
              values={["Public", "Private"]}
              onClickFunctions={[
                () => updateRoomConfig("isPublic", true),
                () => updateRoomConfig("isPublic", false),
              ]}
            />

            <label>Room code:</label>
            <div className="baseFlex gap-2">
              <div className=" text-green-300">{roomConfig.code}</div>
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

        {connectedToRoom ? (
          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseVertFlex gap-4"
          >
            <fieldset className="rounded-md border-2 border-white bg-green-800 p-4">
              <legend className="pl-4 pr-4 text-left text-lg">
                {`Players ${roomConfig.playersInRoom}/${roomConfig.maxPlayers}`}
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

            <PrimaryButton
              innerText={"Start game"}
              disabled={roomConfig.playersInRoom < 2}
              onClickFunction={() => {
                setGameData({} as IGameMetadata);

                socket.emit("startGame", {
                  roomCode: roomConfig.code,
                  firstRound: true,
                });
              }}
              showLoadingSpinnerOnClick={true}
            />
          </div>
        ) : (
          <PrimaryButton
            innerText={"Create"}
            disabled={Object.values(playerMetadata)[0]?.username.length === 0}
            onClickFunction={() => createRoom()}
            showLoadingSpinnerOnClick={true}
          />
        )}
      </div>
      <TopRightControls forPlayScreen={false} />
    </div>
  );
}

export default CreateRoom;
