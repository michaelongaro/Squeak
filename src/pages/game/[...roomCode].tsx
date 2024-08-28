import { useState, useEffect, useCallback, useMemo } from "react";
import { socket } from "~/pages/_app";
import Board from "~/components/Play/Board";
import PlayerCardContainer from "~/components/Play/PlayerCardContainer";
import OtherPlayersCardContainers from "~/components/Play/OtherPlayersCardContainers";
import Scoreboard from "~/components/dialogs/Scoreboard/Scoreboard";
import ShufflingCountdownDialog from "~/components/dialogs/ShufflingCountdownDialog";
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
import MobileVotingPreview from "~/components/dialogs/MobileVotingPreview";
import { type Room } from "@prisma/client";
import { useRouter } from "next/router";
import { useAuth } from "@clerk/nextjs";
import { api } from "~/utils/api";
import { Dialog } from "~/components/ui/dialog";
import UnableToJoinRoom from "~/components/Play/UnableToJoinRoom";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  TbAntennaBarsOff,
  TbAntennaBars2,
  TbAntennaBars3,
  TbAntennaBars4,
  TbAntennaBars5,
} from "react-icons/tb";

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
    showVotingDialog,
    setShowVotingDialog,
    connectedToRoom,
    viewportLabel,
    setShowScoreboard,
    playerPing,
    setPlayerPing,
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
        setShowRoomNotFoundDialog(true);
      } else if (roomResult === "Room is full.") {
        setShowRoomIsFullDialog(true);
      } else if (roomResult === "Game has already started.") {
        setShowGameAlreadyStartedDialog(true);
      }
    }
  }, [roomResult]);

  const [initialEffectRan, setInitialEffectRan] = useState(false);

  // dynamic initialization flow state
  const [
    dynamicInitializationFlowStarted,
    setDynamicInitializationFlowStarted,
  ] = useState(false);
  const [showRoomNotFoundDialog, setShowRoomNotFoundDialog] = useState(false);
  const [showRoomIsFullDialog, setShowRoomIsFullDialog] = useState(false);
  const [showGameAlreadyStartedDialog, setShowGameAlreadyStartedDialog] =
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

  // will only actually show shuffling countdown dialog if user renders this component with
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

  // heartbeat ping interval to update player's ping to the server
  useEffect(() => {
    if (!userID || roomCode === undefined) return;

    const pingInterval = setInterval(() => {
      socket.volatile.emit(
        "measurePlayerPing",
        undefined,
        (serverTimestamp: number) => {
          if (typeof serverTimestamp === "number") {
            setPlayerPing(Math.max(Date.now() - serverTimestamp, 0));
          }
        },
      );
    }, 5000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [userID, roomCode, setPlayerPing]);

  useEffect(() => {
    function handleGoingOffline() {
      setPlayerPing(null);
    }

    // don't need to add "online" listener because the ping will be updated when the user goes back online
    window.addEventListener("offline", handleGoingOffline);

    return () => {
      window.removeEventListener("offline", handleGoingOffline);
    };
  }, [setPlayerPing]);

  useEffect(() => {
    return () => {
      setShowScoreboard(false); // makes sure to reset this state when leaving the page
    };
  }, [setShowScoreboard]);

  const boardContainerClass = useMemo(() => {
    return roomConfig.playersInRoom === 5
      ? classes.fivePlayers
      : classes.fourPlayers;
  }, [roomConfig.playersInRoom]);

  const playerClassNames = useMemo(() => {
    return roomConfig.playersInRoom === 5
      ? [
          classes.topPlayerCard1,
          classes.leftPlayerCards,
          classes.rightPlayerCards,
          classes.topPlayerCard2,
        ]
      : [
          classes.topPlayerCards,
          classes.leftPlayerCards,
          classes.rightPlayerCards,
        ];
  }, [roomConfig.playersInRoom]);

  if (
    showRoomNotFoundDialog ||
    showRoomIsFullDialog ||
    showGameAlreadyStartedDialog
  ) {
    const headerText = showRoomNotFoundDialog
      ? "Room not found"
      : showRoomIsFullDialog
        ? "Room is full"
        : "Game in progress";

    const bodyText = showRoomNotFoundDialog
      ? "The room you are looking for does not exist."
      : showRoomIsFullDialog
        ? "The room you are trying to join is full."
        : "The room you are trying to join is has already started its game.";

    return <UnableToJoinRoom header={headerText} body={bodyText} />;
  }

  if (
    Object.keys(gameData).length === 0 ||
    boardContainerClass === undefined ||
    playerClassNames === undefined
  ) {
    return null;
  }

  return (
    <motion.div
      key={"play"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="baseVertFlex relative h-dvh w-screen select-none desktop:block"
    >
      <div
        id={"playContainer"}
        className={`${classes.fullBoardGrid} ${boardContainerClass} relative z-[150]`}
        onClick={() => {
          if (showVotingDialog && voteType === null) setShowVotingDialog(false);
        }}
      >
        {viewportLabel !== "desktop" ? (
          <div className={`${classes.boardContainer} ${boardContainerClass}`}>
            <Board />
            <OtherPlayersCardContainers orderedClassNames={playerClassNames} />
          </div>
        ) : (
          <>
            <Board />
            <OtherPlayersCardContainers orderedClassNames={playerClassNames} />
          </>
        )}

        <PlayerCardContainer cardContainerClass={classes.currentPlayerCards} />
      </div>

      {!viewportLabel.includes("mobile") && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="absolute left-4 top-4 z-[500] text-lightGreen">
                {playerPing === null && <TbAntennaBarsOff className="size-8" />}

                {playerPing !== null && playerPing < 50 && (
                  <TbAntennaBars5 className="size-8" />
                )}

                {playerPing !== null &&
                  playerPing >= 50 &&
                  playerPing < 150 && <TbAntennaBars4 className="size-8" />}

                {playerPing !== null &&
                  playerPing >= 150 &&
                  playerPing < 300 && <TbAntennaBars3 className="size-8" />}

                {playerPing !== null && playerPing >= 300 && (
                  <TbAntennaBars2 className="size-8" />
                )}
              </TooltipTrigger>

              <TooltipContent
                side={"right"}
                sideOffset={8}
                className="baseFlex z-[500] gap-2 rounded-md border-2 bg-gradient-to-br from-green-800 to-green-850 px-4 py-1 text-lightGreen"
              >
                <p>{playerPing === null ? "Offline" : `${playerPing} ms`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <OtherPlayerIcons />
        </>
      )}

      <AnimatePresence mode={"wait"}>
        {voteType !== null && viewportLabel.includes("mobile") && (
          <MobileVotingPreview />
        )}
      </AnimatePresence>

      <Dialog open={showShufflingCountdown}>
        <AnimatePresence>
          {showShufflingCountdown && <ShufflingCountdownDialog />}
        </AnimatePresence>
      </Dialog>

      <Dialog open={showScoreboard}>
        <AnimatePresence>{showScoreboard && <Scoreboard />}</AnimatePresence>
      </Dialog>
    </motion.div>
  );
}

export default Play;
