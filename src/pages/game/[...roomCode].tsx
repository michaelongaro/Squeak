import { useState, useEffect, useCallback } from "react";
import { socket } from "~/pages/_app";
import Board from "~/components/Play/Board";
import PlayerCardContainer from "~/components/Play/PlayerCardContainer";
import OtherPlayersCardContainers from "~/components/Play/OtherPlayersCardContainers";
import Scoreboard from "~/components/modals/Scoreboard/Scoreboard";
import ShufflingCountdownModal from "~/components/modals/ShufflingCountdownModal";
import useStartAnotherRoundHandler from "../../hooks/useStartAnotherRoundHandler";
import useReturnToRoomHandler from "../../hooks/useReturnToRoomHandler";
import { AnimatePresence, motion } from "framer-motion";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import useResetDeckFromCardDraw from "../../hooks/useResetDeckFromCardDraw";
import useScoreboardData from "../../hooks/useScoreboardData";
import OtherPlayerIcons from "~/components/Play/OtherPlayerIcons";
import classes from "~/components/Play/Play.module.css";
import { Button } from "~/components/ui/button";
import useSyncClientWithServer from "../../hooks/useSyncClientWithServer";
import MiniMobileVotingModal from "~/components/modals/MiniMobileVotingModal";
import { type Room } from "@prisma/client";
import { useRouter } from "next/router";
import { IoHome, IoWarningOutline } from "react-icons/io5";
import { useAuth } from "@clerk/nextjs";
import { api } from "~/utils/api";

function Play() {
  const { isLoaded } = useAuth();
  const userID = useUserIDContext();
  const { query } = useRouter();

  const roomCode = query?.roomCode?.[0];

  const {
    roomConfig,
    gameData,
    playerMetadata,
    queuedCards,
    setGameData,
    showScoreboard,
    setShowShufflingCountdown,
    showShufflingCountdown,
    voteType,
    showVotingModal,
    setShowVotingModal,
    connectedToRoom,
    setConnectedToRoom,
    viewportLabel,
  } = useRoomContext();

  const { data: roomResult } = api.rooms.findRoomByCode.useQuery(
    {
      roomCode: roomCode ?? "",
      playerID: userID,
    },
    {
      enabled: Boolean(roomCode && typeof roomCode === "string"),
    },
  );

  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (roomResult && typeof roomResult === "object") {
      setRoom(roomResult);
    } else {
      if (roomResult === "Room not found.") {
        setShowRoomNotFoundModal(true);
      } else if (roomResult === "Room is full.") {
        setShowRoomIsFullModal(true);
      } else if (roomResult === "Game has already started.") {
        setShowGameAlreadyStartedModal(true);
      }
    }
  }, [roomResult]);

  const [initialEffectRan, setInitialEffectRan] = useState(false);

  // dynamic initialization flow state
  const [
    dynamicInitializationFlowStarted,
    setDynamicInitializationFlowStarted,
  ] = useState(false);
  const [showRoomNotFoundModal, setShowRoomNotFoundModal] = useState(false);
  const [showRoomIsFullModal, setShowRoomIsFullModal] = useState(false);
  const [showGameAlreadyStartedModal, setShowGameAlreadyStartedModal] =
    useState(false);

  useStartAnotherRoundHandler();
  useReturnToRoomHandler();
  useResetDeckFromCardDraw();
  useScoreboardData();
  useSyncClientWithServer();

  const dynamicallyHandleInitializationFlow = useCallback(() => {
    // player was a part of the room already, rejoining.
    if (room && room.playerIDsInRoom.includes(userID) && !connectedToRoom) {
      socket.emit("rejoinRoom", {
        userID,
        code: room.code,
      });

      setConnectedToRoom(true);
    }
  }, [connectedToRoom, room, setConnectedToRoom, userID]);

  useEffect(() => {
    if (
      dynamicInitializationFlowStarted ||
      !isLoaded ||
      !userID ||
      !playerMetadata[userID] ||
      connectedToRoom
    )
      return;

    setDynamicInitializationFlowStarted(true);

    dynamicallyHandleInitializationFlow();
  }, [
    dynamicInitializationFlowStarted,
    dynamicallyHandleInitializationFlow,
    room,
    userID,
    isLoaded,
    playerMetadata,
    connectedToRoom,
  ]);

  // will only actually show shuffling countdown modal if user renders this component with
  // the init game state in gameData, instead of always showing whenever connecting/reconnecting to game
  useEffect(() => {
    if (initialEffectRan) return;

    setInitialEffectRan(true);
    setDynamicInitializationFlowStarted(true);

    if (Object.keys(gameData).length === 0) return;

    function checkIfGameHasJustStarted() {
      for (const playerID in gameData.players) {
        if (
          gameData.players[playerID]?.squeakDeck.length !== 13 ||
          gameData.players[playerID]?.deck.length !== 39
        ) {
          return false;
        }
      }

      return true;
    }

    if (checkIfGameHasJustStarted()) {
      setShowShufflingCountdown(true);
    }

    socket.emit("modifyFriendData", {
      action: "startGame",
      initiatorID: userID,
    });
  }, [
    initialEffectRan,
    gameData,
    roomConfig.code,
    setGameData,
    setShowShufflingCountdown,
    userID,
    playerMetadata,
  ]);

  // 15s interval to periodically check if client is out of sync with server
  // and if so, emit a syncClientWithServer event to the client
  useEffect(() => {
    if (showShufflingCountdown || showScoreboard) return;

    const interval = setInterval(() => {
      socket.emit("checkClientSyncWithServer", {
        roomCode: roomConfig.code,
        playerID: userID,
        clientGameData: gameData,
        clientQueuedCards: queuedCards,
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [
    roomConfig.code,
    showShufflingCountdown,
    showScoreboard,
    userID,
    gameData,
    queuedCards,
  ]);

  if (showRoomNotFoundModal) {
    return <RoomNotFound />;
  }

  if (showRoomIsFullModal) {
    return <RoomIsFull />;
  }

  if (showGameAlreadyStartedModal) {
    return <GameAlreadyStarted />;
  }

  if (Object.keys(gameData).length === 0) return null;

  return (
    <motion.div
      key={"play"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="baseVertFlex relative h-dvh w-screen desktop:block"
    >
      <div
        id={"playContainer"}
        className={`${classes.fullBoardGrid} relative z-[150]`}
        onClick={() => {
          if (showVotingModal && voteType === null) setShowVotingModal(false);
        }}
      >
        {viewportLabel !== "desktop" ? (
          <div className={classes.boardContainer}>
            <Board />
            <OtherPlayersCardContainers
              orderedClassNames={[
                classes.topPlayerCards,
                classes.leftPlayerCards,
                classes.rightPlayerCards,
              ]}
            />
          </div>
        ) : (
          <>
            <Board />
            <OtherPlayersCardContainers
              orderedClassNames={[
                classes.topPlayerCards,
                classes.leftPlayerCards,
                classes.rightPlayerCards,
              ]}
            />
          </>
        )}

        <PlayerCardContainer cardContainerClass={classes.currentPlayerCards} />
      </div>

      {!viewportLabel.includes("mobile") && <OtherPlayerIcons />}

      <AnimatePresence mode={"wait"}>
        {voteType !== null && viewportLabel === "mobile" && (
          <MiniMobileVotingModal />
        )}
      </AnimatePresence>

      <AnimatePresence mode={"wait"}>
        {showShufflingCountdown && <ShufflingCountdownModal />}
      </AnimatePresence>

      <AnimatePresence mode={"wait"}>
        {showScoreboard && <Scoreboard />}
      </AnimatePresence>
    </motion.div>
  );
}

export default Play;

function RoomNotFound() {
  const router = useRouter();

  return (
    <div className="baseVertFlex min-h-[100dvh] py-16">
      <div className="baseVertFlex w-10/12 gap-4 rounded-md border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 p-4 text-lightGreen md:w-[500px] md:p-8">
        <div className="baseFlex gap-2">
          <IoWarningOutline className="h-8 w-8" />
          <h1 className="text-2xl font-semibold">Room not found</h1>
        </div>
        <p className="text-center text-lg">
          The room you are looking for does not exist.
        </p>

        <Button
          icon={<IoHome size={"1.25rem"} />}
          innerText={"Return home"}
          iconOnLeft
          onClickFunction={() => router.push("/")}
          className="mt-4 gap-3"
        />
      </div>
    </div>
  );
}

function RoomIsFull() {
  const router = useRouter();

  return (
    <div className="baseVertFlex min-h-[100dvh] py-16">
      <div className="baseVertFlex w-10/12 gap-4 rounded-md border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 p-4 text-lightGreen md:w-[500px] md:p-8">
        <div className="baseFlex gap-2">
          <IoWarningOutline className="h-8 w-8" />
          <h1 className="text-2xl font-semibold">Room is full</h1>
        </div>
        <p className="text-center text-lg">
          The room you are trying to join is full.
        </p>

        <Button
          icon={<IoHome size={"1.25rem"} />}
          innerText={"Return home"}
          iconOnLeft
          onClickFunction={() => router.push("/")}
          className="mt-4 gap-3"
        />
      </div>
    </div>
  );
}

function GameAlreadyStarted() {
  const router = useRouter();

  return (
    <div className="baseVertFlex min-h-[100dvh] py-16">
      <div className="baseVertFlex w-10/12 gap-4 rounded-md border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 p-4 text-lightGreen md:w-[500px] md:p-8">
        <div className="baseFlex gap-2">
          <IoWarningOutline className="h-8 w-8" />
          <h1 className="text-2xl font-semibold">Game in progress</h1>
        </div>
        <p className="text-center text-lg">
          The room you are trying to join is has already started its game.
        </p>

        <Button
          icon={<IoHome size={"1.25rem"} />}
          innerText={"Return home"}
          iconOnLeft
          onClickFunction={() => router.push("/")}
          className="mt-4 gap-3"
        />
      </div>
    </div>
  );
}
