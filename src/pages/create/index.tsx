import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import cryptoRandomString from "crypto-random-string";
import { api } from "~/utils/api";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import {
  type IRoomPlayersMetadata,
  type IGameMetadata,
  type IRoomPlayer,
} from "../../pages/api/socket";
import { IoSettingsSharp } from "react-icons/io5";
import { FaRobot } from "react-icons/fa6";
import { FaUsers } from "react-icons/fa";
import PlayerIcon from "~/components/playerIcons/PlayerIcon";
import SecondaryButton from "~/components/Buttons/SecondaryButton";
import Radio from "~/components/Buttons/Radio";
import { MdCopyAll } from "react-icons/md";
import { IoHome } from "react-icons/io5";
import { BiArrowBack } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "~/components/ui/input";
import Filter from "bad-words";
import useLeaveRoom from "../../hooks/useLeaveRoom";
import useGetViewportLabel from "~/hooks/useGetViewportLabel";
import PlayerCustomizationPopover from "~/components/popovers/PlayerCustomizationPopover";
import PlayerCustomizationPreview from "~/components/playerIcons/PlayerCustomizationPreview";
import PlayerCustomizationDrawer from "~/components/drawers/PlayerCustomizationDrawer";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import Head from "next/head";
import { useRouter } from "next/router";

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
  "Bot Anthony",
];

export interface IRoomConfig {
  pointsToWin: number;
  maxPlayers: number;
  playersInRoom: number;
  playerIDsInRoom: string[];
  isPublic: boolean;
  code: string;
  hostUsername: string;
  hostUserID: string;
  gameStarted: boolean;
}

function CreateRoom() {
  const { isSignedIn } = useAuth();
  const { push } = useRouter();

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
  } = useRoomContext();

  const leaveRoom = useLeaveRoom({
    routeToNavigateTo: connectedToRoom ? "/create" : "/",
  });

  const viewportLabel = useGetViewportLabel();

  const { data: authenticatedUsers } = api.users.getUsersFromIDList.useQuery(
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
        playerIDsInRoom: [userID],
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
    function handlePlayerMetadataUpdated(newUsers: IRoomPlayersMetadata) {
      setPlayerMetadata(newUsers);
    }

    function handleRoomConfigUpdated(roomConfig: IRoomConfig) {
      setRoomConfig(roomConfig);
    }

    function handleNavigateToPlayScreen(initGameData: IGameMetadata) {
      push(`/game/${roomConfig.code}`);
      setGameData(initGameData);
    }

    socket.on("playerMetadataUpdated", handlePlayerMetadataUpdated);
    socket.on("roomConfigUpdated", handleRoomConfigUpdated);
    socket.on("navigateToPlayScreen", handleNavigateToPlayScreen);

    return () => {
      socket.off("playerMetadataUpdated", handlePlayerMetadataUpdated);
      socket.off("roomConfigUpdated", handleRoomConfigUpdated);
      socket.off("navigateToPlayScreen", handleNavigateToPlayScreen);
    };
  }, [
    setConnectedToRoom,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
    push,
    roomConfig.code,
  ]);

  function createRoom() {
    if (roomConfig && userID) {
      setConnectedToRoom(true);

      socket.emit("createRoom", roomConfig, playerMetadata[userID]);

      if (isSignedIn) {
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
      className="baseVertFlex relative min-h-[100dvh] py-16"
    >
      <Head>
        <title>Create | Squeak</title>
      </Head>

      <div className="baseVertFlex relative gap-4">
        <div className="absolute left-4 top-0 sm:left-0">
          <Button
            variant={"secondary"}
            icon={
              connectedToRoom ? (
                <BiArrowBack size={"1.5rem"} />
              ) : (
                <IoHome size={"1.5rem"} />
              )
            }
            className="h-10 w-10"
            onClick={() => {
              setConfigAndMetadataInitialized(false);
              leaveRoom();
            }}
          />
        </div>

        <div
          style={{
            color: "hsl(120deg 100% 86%)",
            filter: "drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.2))",
          }}
          className="mt-1.5 text-xl font-medium"
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
              <Label
                style={{
                  color: "hsl(120deg 100% 86%)",
                }}
              >
                Username
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="username"
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
                  className="absolute right-1 top-0 text-xl text-red-600 transition-opacity"
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

            {viewportLabel === "tablet" || viewportLabel === "desktop" ? (
              <div className="baseFlex gap-12 text-lightGreen">
                <div className="baseVertFlex gap-2">
                  <PlayerCustomizationPopover type={"avatar"} />
                  <p className="mt-[0.25rem]">Avatar</p>
                </div>
                <div className="baseVertFlex gap-2">
                  <PlayerCustomizationPopover type={"front"} />
                  <p>Front</p>
                </div>
                <div className="baseVertFlex gap-2">
                  <PlayerCustomizationPopover type={"back"} />
                  <p>Back</p>
                </div>
              </div>
            ) : (
              <div className="baseVertFlex gap-4">
                <div className="baseFlex gap-12">
                  <div className="baseVertFlex">
                    <PlayerCustomizationPreview
                      renderedView={"avatar"}
                      forCreateAndJoin
                    />
                  </div>
                  <div className="baseVertFlex gap-2">
                    <PlayerCustomizationPreview
                      renderedView={"front"}
                      forCreateAndJoin
                    />
                  </div>
                  <div className="baseVertFlex gap-2">
                    <PlayerCustomizationPreview
                      renderedView={"back"}
                      forCreateAndJoin
                    />
                  </div>
                </div>
                <PlayerCustomizationDrawer />
              </div>
            )}
          </div>
        )}

        <fieldset className="mt-4 w-[350px] rounded-md border-2 border-white bg-green-800 p-2 sm:min-w-[450px] sm:p-4">
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
            className="grid grid-cols-2 grid-rows-4 items-center gap-y-4 p-1 sm:p-2"
          >
            <Label>Points to win:</Label>
            <div className=" baseFlex !justify-between gap-2 pl-4 pr-4">
              <SecondaryButton
                innerText={"-25"}
                disabled={roomConfig.pointsToWin <= 25}
                extraPadding={false}
                width={"3rem"}
                height={"3rem"}
                onClickFunction={() =>
                  updateRoomConfig("pointsToWin", roomConfig.pointsToWin - 25)
                }
              />

              <div className="text-lightGreen">{roomConfig.pointsToWin}</div>

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

            <Label>Players:</Label>
            <Radio
              values={[2, 3, 4]}
              disabledIndicies={[0, 1, 2].slice(
                0,
                Math.max(0, Object.keys(playerMetadata).length - 2)
              )}
              currentValueIndex={[2, 3, 4].indexOf(roomConfig.maxPlayers)}
              onClickFunctions={[
                () => updateRoomConfig("maxPlayers", 2),
                () => updateRoomConfig("maxPlayers", 3),
                () => updateRoomConfig("maxPlayers", 4),
              ]}
            />

            <Label>Room visibility:</Label>
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

            <Label>Room code:</Label>
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
                innerText={showCheckmark ? "Copied" : "Copy"}
                extraPadding={false}
                onClickFunction={() => {
                  navigator.clipboard.writeText(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/join/${roomConfig.code}`
                  );
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
            <fieldset className="min-w-[14rem] rounded-md border-2 border-white bg-green-800 p-4">
              <legend className="baseFlex gap-2 pl-4 pr-4 text-left text-lg">
                Players
                <div className="tracking-widest">{`(${roomConfig.playersInRoom}/${roomConfig.maxPlayers})`}</div>
                <FaUsers size={"1.25rem"} />
              </legend>
              <div className="baseVertFlex gap-6 p-2">
                <div
                  className={`sm:baseVertFlex grid grid-cols-2 ${
                    roomConfig.playersInRoom > 2 ? "grid-rows-2" : "grid-rows-1"
                  } !items-start !justify-start gap-8 sm:flex sm:!flex-row`}
                >
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
                    <div className="baseFlex h-full w-full !items-start sm:w-auto">
                      <SecondaryButton
                        icon={<FaRobot size={"1.5rem"} />}
                        extraPadding={false}
                        innerText="Add bot"
                        style={{
                          width: "4rem",
                          height: "4rem",
                          fontSize: "0.75rem",
                          whiteSpace: "nowrap",
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
                    </div>
                  )}
                </div>

                <div className="h-[2px] w-full rounded-md bg-white"></div>

                {viewportLabel === "tablet" || viewportLabel === "desktop" ? (
                  <div className="baseFlex gap-12 text-lightGreen">
                    <div className="baseVertFlex gap-2">
                      <PlayerCustomizationPopover type={"avatar"} />
                      <p className="mt-[0.25rem]">Avatar</p>
                    </div>
                    <div className="baseVertFlex gap-2">
                      <PlayerCustomizationPopover type={"front"} />
                      <p>Front</p>
                    </div>
                    <div className="baseVertFlex gap-2">
                      <PlayerCustomizationPopover type={"back"} />
                      <p>Back</p>
                    </div>
                  </div>
                ) : (
                  <div className="baseVertFlex gap-4">
                    <div className="baseFlex gap-12">
                      <div className="baseVertFlex">
                        <PlayerCustomizationPreview
                          renderedView={"avatar"}
                          forCreateAndJoin
                        />
                      </div>
                      <div className="baseVertFlex gap-2">
                        <PlayerCustomizationPreview
                          renderedView={"front"}
                          forCreateAndJoin
                        />
                      </div>
                      <div className="baseVertFlex gap-2">
                        <PlayerCustomizationPreview
                          renderedView={"back"}
                          forCreateAndJoin
                        />
                      </div>
                    </div>
                    <PlayerCustomizationDrawer />
                  </div>
                )}
              </div>
            </fieldset>

            <Button
              innerText={"Start game"}
              innerTextWhenLoading={"Starting game"}
              disabled={roomConfig.playersInRoom < 2}
              isDisabled={roomConfig.playersInRoom < 2}
              onClickFunction={() => {
                socket.emit("startGame", {
                  roomCode: roomConfig.code,
                  firstRound: true,
                });
              }}
              showLoadingSpinnerOnClick={true}
              className="h-12 w-[14rem] gap-4 text-[1.05rem]"
            />
          </div>
        ) : (
          <Button
            innerText={"Create"}
            innerTextWhenLoading={"Creating"}
            disabled={
              Object.values(playerMetadata)[0]?.username.length === 0 ||
              usernameIsProfane
            }
            isDisabled={
              Object.values(playerMetadata)[0]?.username.length === 0 ||
              usernameIsProfane
            }
            onClickFunction={() => createRoom()}
            showLoadingSpinnerOnClick={true}
            className="h-12 w-[12rem] gap-4 text-[1.05rem]"
          />
        )}
      </div>
    </motion.div>
  );
}

export default CreateRoom;
