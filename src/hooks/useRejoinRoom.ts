import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IRejoinData } from "./../pages/api/socket";

function useRejoinRoom() {
  const userID = useUserIDContext();

  const {
    setRoomConfig,
    setPlayerMetadata,
    setGameData,
    setConnectedToRoom,
    setShowScoreboard,
    setScoreboardMetadata,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IRejoinData | null>(
    null,
  );

  useEffect(() => {
    socket.on("rejoinData", (data) => setDataFromBackend(data));

    return () => {
      socket.off("rejoinData", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const {
        userID: userIDFromBackend,
        roomConfig,
        gameData,
        players,
        scoreboardMetadata,
      } = dataFromBackend;

      setRoomConfig(roomConfig);
      setPlayerMetadata(players);
      setGameData(gameData);

      if (userID !== userIDFromBackend) return;

      // TODO: don't really like this approach btw. also might be fine to eliminiate
      // the early return above as well, not sure if it would cause any scoreboard
      // that is currently being shown to restart it's whole animation effect
      // process or not. Main reason we moved the early return down was so that other players
      // would be updated to the fact that a player had rejoined the room, not just the player
      // that is rejoining themself.

      if (scoreboardMetadata) {
        setShowScoreboard(true);
        setScoreboardMetadata(scoreboardMetadata);
      }

      setConnectedToRoom(true);
    }
  }, [
    dataFromBackend,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
    setConnectedToRoom,
    setShowScoreboard,
    setScoreboardMetadata,
    userID,
  ]);
}

export default useRejoinRoom;
