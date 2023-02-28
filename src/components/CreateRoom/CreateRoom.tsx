import { useState, useEffect } from "react";
import cryptoRandomString from "crypto-random-string";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useRoomContext } from "../../context/RoomContext";
import { useUserIDContext } from "../../context/UserIDContext";
import { type IRoomPlayer, type IGameMetadata } from "../../pages/api/socket";
import PickerTooltip from "../playerIcons/PickerTooltip";
import PlayerIcon from "../playerIcons/PlayerIcon";
import SecondaryButton from "../Buttons/SecondaryButton";
import Radio from "../Buttons/Radio";
import { MdCopyAll } from "react-icons/md";
import PrimaryButton from "../Buttons/PrimaryButton";
import { BiArrowBack } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import Filter from "bad-words";
import { useSession } from "next-auth/react";

const filter = new Filter();

export interface IRoomConfig {
  pointsToWin: number;
  maxPlayers: number;
  playersInRoom: number;
  isPublic: boolean;
  code: string;
  hostUsername: string;
  hostUserID: string;
  gameStarted: boolean;
}

function CreateRoom() {
  const {
    roomConfig,
    setRoomConfig,
    playerMetadata,
    setPlayerMetadata,
    friendData,
    connectedToRoom,
    setConnectedToRoom,
    setGameData,
    setPageToRender,
    leaveRoom,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();
  const { data: session, status } = useSession();

  const createRoomInDatabase = trpc.rooms.createRoom.useMutation();
  const updateRoomInDatabase = trpc.rooms.updateRoomConfig.useMutation();

  const { data: authenticatedUsers } = trpc.users.getUsersFromIDList.useQuery(
    Object.keys(playerMetadata)
  );

  const [configAndMetadataInitialized, setConfigAndMetadataInitialized] =
    useState<boolean>(false);
  const [showCheckmark, setShowCheckmark] = useState<boolean>(false);
  const [focusedInInput, setFocusedInInput] = useState<boolean>(false);
  const [usernameIsProfane, setUsernameIsProfane] = useState<boolean>(false);

  // needs !connectedToRoom for when player inherits ownership of room after host leaves,
  // otherwise they would be overwriting the current room config
  useEffect(() => {
    if (!configAndMetadataInitialized && userID && !connectedToRoom) {
      setRoomConfig((prevRoomConfig) => ({
        ...prevRoomConfig,
        code: cryptoRandomString({ length: 6 }),
        hostUsername: playerMetadata[userID]?.username || "",
        hostUserID: userID,
      }));

      setConfigAndMetadataInitialized(true);
    }
  }, [
    playerMetadata,
    setRoomConfig,
    userID,
    configAndMetadataInitialized,
    connectedToRoom,
  ]);

  useEffect(() => {
    socket.on("roomWasCreated", () => setConnectedToRoom(true));

    socket.on("playerMetadataUpdated", (newUsers) => {
      setPlayerMetadata(newUsers);
    });

    // here db update
    socket.on("roomConfigUpdated", (roomConfig) =>
      updateContextAndDatabaseRoomConfig(roomConfig)
    );

    socket.on("navigateToPlayScreen", () => setPageToRender("play"));

    return () => {
      socket.off("roomWasCreated", () => setConnectedToRoom(true));
      socket.off("playerMetadataUpdated", (newUsers) =>
        setPlayerMetadata(newUsers)
      );
      socket.off("roomConfigUpdated", (roomConfig) =>
        updateContextAndDatabaseRoomConfig(roomConfig)
      );
      socket.off("navigateToPlayScreen", () => setPageToRender("play"));
    };
  }, []);
  // might need to add roomCtx to deps here

  function createRoom() {
    if (roomConfig && userID) {
      setConnectedToRoom(true);

      socket.emit("createRoom", roomConfig, playerMetadata[userID]);

      if (status === "authenticated") {
        socket.emit("modifyFriendData", {
          action: "createRoom",
          initiatorID: userID,
          roomCode: roomConfig.code,
          currentRoomIsPublic: roomConfig.isPublic,
        });
      }

      createRoomInDatabase.mutate(roomConfig);
    }
  }

  // separate this out into a hook?
  function updateContextAndDatabaseRoomConfig(newRoomConfig: IRoomConfig) {
    setRoomConfig(newRoomConfig);
    updateRoomInDatabase.mutate({
      pointsToWin: newRoomConfig.pointsToWin,
      maxPlayers: newRoomConfig.maxPlayers,
      isPublic: newRoomConfig.isPublic,
      code: newRoomConfig.code,
      hostUsername: newRoomConfig.hostUsername,
      hostUserID: newRoomConfig.hostUserID,
      playersInRoom: newRoomConfig.playersInRoom,
      gameStarted: newRoomConfig.gameStarted,
    });
  }

  function updateRoomConfig(key: string, value: any) {
    setRoomConfig({ ...roomConfig, [key]: value });
    if (connectedToRoom) {
      socket.emit("updateRoomConfig", {
        ...roomConfig,
        [key]: value,
      });
    }
  }

  return (
    <motion.div
      key={"createRoom"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseVertFlex relative min-h-[100vh]"
    >
      <div className="baseVertFlex relative gap-2 ">
        <div className="absolute top-0 left-0">
          <SecondaryButton
            icon={<BiArrowBack size={"1.5rem"} />}
            extraPadding={false}
            onClickFunction={() => {
              setConfigAndMetadataInitialized(false);
              leaveRoom(connectedToRoom ? false : true);
            }}
          />
        </div>

        <div
          style={{
            color: "hsl(120deg 100% 86%)",
            filter: "drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.2))",
          }}
          className="text-xl font-medium"
        >
          {`${
            connectedToRoom
              ? `${Object.values(playerMetadata)[0]?.username}'s room`
              : "Create room"
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
              <div className="relative">
                <input
                  type="text"
                  placeholder="username"
                  className=" rounded-sm pl-2 text-green-800"
                  maxLength={16}
                  onFocus={() => setFocusedInInput(true)}
                  onBlur={() => setFocusedInInput(false)}
                  onChange={(e) => {
                    setUsernameIsProfane(filter.isProfane(e.target.value));

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
                <div
                  style={{
                    opacity:
                      focusedInInput ||
                      playerMetadata[userID]?.username?.length === 0
                        ? 1
                        : 0,
                  }}
                  className="absolute top-[-0.25rem] right-1 text-xl text-red-600 transition-all"
                >
                  *
                </div>

                <AnimatePresence>
                  {usernameIsProfane && (
                    <motion.div
                      key={"createRoomProfanityWarning"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        right: "-235px",
                        color: "hsl(120deg 100% 86%)",
                      }}
                      className="baseVertFlex absolute top-0 gap-2 rounded-md border-2 border-red-700 bg-green-700 pt-2 pb-2 pr-1 pl-1 shadow-md"
                    >
                      <div>Username not allowed,</div>
                      <div className="text-center">
                        please choose another one
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
            className="grid grid-cols-2 grid-rows-4 items-center gap-2 p-4"
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

              <div
                style={{
                  color: "hsl(120deg 100% 86%)",
                }}
              >
                {roomConfig.pointsToWin}
              </div>

              <SecondaryButton
                innerText={"+25"}
                disabled={roomConfig.pointsToWin >= 300}
                extraPadding={false}
                width={"3rem"}
                height={"3rem"}
                onClickFunction={() =>
                  updateRoomConfig("pointsToWin", roomConfig.pointsToWin + 25)
                }
              />
            </div>

            <label>Players:</label>

            <Radio
              values={[2, 3, 4]}
              currentValueIndex={[2, 3, 4].indexOf(roomConfig.maxPlayers)}
              onClickFunctions={[
                () => updateRoomConfig("maxPlayers", 2),
                () => updateRoomConfig("maxPlayers", 3),
                () => updateRoomConfig("maxPlayers", 4),
              ]}
            />

            <label>Room visibility:</label>
            <Radio
              values={["Public", "Private"]}
              currentValueIndex={["Public", "Private"].indexOf(
                roomConfig.isPublic ? "Public" : "Private"
              )}
              onClickFunctions={[
                () => updateRoomConfig("isPublic", true),
                () => updateRoomConfig("isPublic", false),
              ]}
            />

            <label>Room code:</label>
            <div className="baseFlex gap-2">
              <div
                style={{
                  color: "hsl(120deg 100% 86%)",
                }}
              >
                {roomConfig.code}
              </div>
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
              <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg">
                Players
                <div className="tracking-widest">{`(${roomConfig.playersInRoom}/${roomConfig.maxPlayers})`}</div>
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
                      playerID={playerID}
                      size={"3rem"}
                      showAddFriendButton={
                        userID !== playerID &&
                        friendData?.friendIDs?.indexOf(playerID) === -1 &&
                        authenticatedUsers
                          ? authenticatedUsers.findIndex(
                              (player) => player.id === playerID
                            ) !== -1
                          : false
                      }
                      showRemovePlayerFromRoomButton={userID !== playerID}
                    />
                  ))}
                </div>

                <div className="h-[2px] w-full rounded-md bg-white"></div>

                <div className="baseFlex gap-12">
                  <PickerTooltip type={"avatar"} openAbove={true} />
                  <PickerTooltip type={"color"} openAbove={true} />
                </div>
              </div>
            </fieldset>

            <PrimaryButton
              innerText={"Start game"}
              innerTextWhenLoading={"Starting game"}
              disabled={roomConfig.playersInRoom < 2}
              onClickFunction={() => {
                setGameData({} as IGameMetadata);

                socket.emit("startGame", {
                  roomCode: roomConfig.code,
                  firstRound: true,
                });

                updateRoomInDatabase.mutate({
                  ...roomConfig,
                  gameStarted: true,
                });
              }}
              showLoadingSpinnerOnClick={true}
            />
          </div>
        ) : (
          <PrimaryButton
            innerText={"Create"}
            innerTextWhenLoading={"Creating"}
            disabled={
              Object.values(playerMetadata)[0]?.username.length === 0 ||
              usernameIsProfane
            }
            onClickFunction={() => createRoom()}
            showLoadingSpinnerOnClick={true}
          />
        )}
      </div>
    </motion.div>
  );
}

export default CreateRoom;
