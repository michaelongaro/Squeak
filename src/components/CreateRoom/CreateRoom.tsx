import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import cryptoRandomString from "crypto-random-string";
import { trpc } from "../../utils/trpc";
import { socket } from "../../pages";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import { type IGameMetadata, type IRoomPlayer } from "../../pages/api/socket";
import { IoSettingsSharp } from "react-icons/io5";
import { FaRobot } from "react-icons/fa6";
import { FaUsers } from "react-icons/fa";
import PickerTooltip from "../playerIcons/PickerTooltip";
import PlayerIcon from "../playerIcons/PlayerIcon";
import SecondaryButton from "../Buttons/SecondaryButton";
import Radio from "../Buttons/Radio";
import { MdCopyAll } from "react-icons/md";
import PrimaryButton from "../Buttons/PrimaryButton";
import { IoHome } from "react-icons/io5";
import { BiArrowBack } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import Filter from "bad-words";
import useLeaveRoom from "../../hooks/useLeaveRoom";
const filter = new Filter();

const botNames = [
  "Bot Eric",
  "Bot John",
  "Bot Tyrus",
  "Bot Antonio",
  "Bot Galvin",
  "Bot Owen",
  "Bot Alex",
  "Bot Ritz",
  "Bot George",
  "Bot Michael",
  "Bot Andrew",
  "Bot Gilbert",
  "Bot Wan",
  "Bot Anthony",
];

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
  const { status } = useSession();

  const userID = useUserIDContext();

  const {
    roomConfig,
    setRoomConfig,
    playerMetadata,
    setPlayerMetadata,
    connectedToRoom,
    setConnectedToRoom,
    friendData,
    setGameData,
    setPageToRender,
  } = useRoomContext();

  const leaveRoom = useLeaveRoom();

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
      setRoomConfig({
        ...roomConfig,
        code: cryptoRandomString({ length: 6 }),
        hostUsername: playerMetadata[userID]?.username || "",
        hostUserID: userID,
      });

      setConfigAndMetadataInitialized(true);
    }
  }, [
    configAndMetadataInitialized,
    userID,
    connectedToRoom,
    playerMetadata,
    roomConfig,
    setRoomConfig,
  ]);

  useEffect(() => {
    socket.on("roomWasCreated", () => setConnectedToRoom(true));

    socket.on("playerMetadataUpdated", (newUsers) => {
      setPlayerMetadata(newUsers);
    });

    socket.on("roomConfigUpdated", (roomConfig) => setRoomConfig(roomConfig));

    socket.on("navigateToPlayScreen", (initGameData: IGameMetadata) => {
      setPageToRender("play");
      setGameData(initGameData);
    });

    return () => {
      socket.off("roomWasCreated", () => setConnectedToRoom(true));
      socket.off("playerMetadataUpdated", (newUsers) =>
        setPlayerMetadata(newUsers)
      );
      socket.off("roomConfigUpdated", (roomConfig) =>
        setRoomConfig(roomConfig)
      );
      socket.off("navigateToPlayScreen", (initGameData: IGameMetadata) => {
        setPageToRender("play");
        setGameData(initGameData);
      });
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
  }

  function getNewBotMetadata() {
    let uniqueBotName = "";
    do {
      uniqueBotName = botNames[
        Math.floor(Math.random() * botNames.length)
      ] as string;
    } while (
      Object.values(playerMetadata).findIndex(
        (player) => player?.username === uniqueBotName
      ) !== -1
    );

    return {
      username: uniqueBotName,
      avatarPath: "/avatars/rabbit.svg",
      color: "hsl(352deg, 69%, 61%)",
      deckHueRotation: 232,
      botDifficulty: "Medium",
    } as IRoomPlayer;
  }

  return (
    <motion.div
      key={"createRoom"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseVertFlex relative min-h-[100dvh]"
    >
      <div className="baseVertFlex relative gap-4">
        <div className="absolute left-[-3.5rem] top-0">
          <SecondaryButton
            icon={
              connectedToRoom ? (
                <BiArrowBack size={"1.5rem"} />
              ) : (
                <IoHome size={"1.5rem"} />
              )
            }
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
                  className=" rounded-md py-1 pl-2 text-green-800"
                  maxLength={16}
                  onFocus={() => setFocusedInInput(true)}
                  onBlur={() => setFocusedInInput(false)}
                  onChange={(e) => {
                    setUsernameIsProfane(filter.isProfane(e.target.value));

                    setPlayerMetadata({
                      ...playerMetadata,
                      [userID]: {
                        ...playerMetadata[userID],
                        username: e.target.value,
                      } as IRoomPlayer,
                    });
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
                  className="absolute right-1 top-[-0.25rem] text-xl text-red-600 transition-opacity"
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
                        right: "-255px",
                        color: "hsl(120deg 100% 86%)",
                      }}
                      className="baseVertFlex absolute top-0 gap-2 rounded-md border-2 border-red-700 bg-green-700 pb-2 pl-1 pr-1 pt-2 shadow-md"
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

        <fieldset className="mt-4 min-w-[450px] rounded-md border-2 border-white bg-green-800 p-4">
          <legend
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseFlex gap-2 pl-4 pr-4 text-left text-lg"
          >
            Room settings
            <IoSettingsSharp size={"1.25rem"} />
          </legend>

          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="grid grid-cols-2 grid-rows-4 items-center gap-y-4 p-4"
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
            <div className="baseFlex gap-4">
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
                <FaUsers size={"1.25rem"} />
              </legend>
              <div className="baseVertFlex gap-6 p-4">
                <div className="baseFlex !items-start gap-8">
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
                      playerMetadata={playerMetadata[playerID]}
                      roomHostIsRendering={true}
                    />
                  ))}

                  {/* Add bot button */}
                  {Object.keys(playerMetadata).length <
                    roomConfig.maxPlayers && (
                    <SecondaryButton
                      icon={<FaRobot size={"1.5rem"} />}
                      extraPadding={false}
                      innerText="Add bot"
                      style={{
                        width: "4rem",
                        height: "4rem",
                        fontSize: "0.75rem",
                        textWrap: "nowrap",
                        flexDirection: "column-reverse",
                      }}
                      onClickFunction={() => {
                        const botID = cryptoRandomString({ length: 16 });

                        socket.emit("joinRoom", {
                          code: roomConfig.code,
                          userID: botID,
                          playerMetadata: getNewBotMetadata(),
                        });
                      }}
                    />
                  )}
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
            innerTextWhenLoading={"Creating"}
            width="50%"
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
