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
import useSyncClientWithServer from "../../hooks/useSyncClientWithServer";
import MiniMobileVotingModal from "~/components/modals/MiniMobileVotingModal";
import { type Room } from "@prisma/client";
import { useRouter } from "next/router";
import { useAuth } from "@clerk/nextjs";
import { api } from "~/utils/api";
import UnableToJoinRoom from "~/components/Play/UnableToJoinRoom";

function Play() {
  const { isLoaded } = useAuth();
  const userID = useUserIDContext();
  const { query } = useRouter();

  const roomCode = query?.roomCode?.[0];

  const {
    roomConfig,
    gameData,
    playerMetadata,
    setGameData,
    showScoreboard,
    setShowShufflingCountdown,
    showShufflingCountdown,
    voteType,
    showVotingModal,
    setShowVotingModal,
    connectedToRoom,
    viewportLabel,
    setShowScoreboard,
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
      socket.volatile.emit("rejoinRoom", {
        userID,
        code: room.code,
      });
    }
  }, [connectedToRoom, room, userID]);

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

    socket.volatile.emit("modifyFriendData", {
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

  useEffect(() => {
    return () => {
      setShowScoreboard(false); // makes sure to reset this state when leaving the page
    };
  }, [setShowScoreboard]);

  if (
    showRoomNotFoundModal ||
    showRoomIsFullModal ||
    showGameAlreadyStartedModal
  ) {
    const headerText = showRoomNotFoundModal
      ? "Room not found"
      : showRoomIsFullModal
        ? "Room is full"
        : "Game in progress";

    const bodyText = showRoomNotFoundModal
      ? "The room you are looking for does not exist."
      : showRoomIsFullModal
        ? "The room you are trying to join is full."
        : "The room you are trying to join is has already started its game.";

    return <UnableToJoinRoom header={headerText} body={bodyText} />;
  }

  if (Object.keys(gameData).length === 0) return null;

  return (
    <motion.div
      key={"play"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
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
        {voteType !== null && viewportLabel.includes("mobile") && (
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
