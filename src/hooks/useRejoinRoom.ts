import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IRejoinData } from "./../pages/api/socket";

// this hook has auth hook in it but I think it was just from a copy paste
// from another hook to get a boilerplate

function useRejoinRoom() {
  const userID = useUserIDContext();

  const { setRoomConfig, setPlayerMetadata, setGameData, setConnectedToRoom } =
    useRoomContext();

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
      } = dataFromBackend;

      // TODO/FYI: this is fine w/ your current setup since you are sending
      // the whole game state on every action, but if you ever atomize the
      // payload then you would probably want to either broadcast the modified
      // playerIDsThatLeftMidgame state or something similar to similar effect
      if (userID !== userIDFromBackend) return;

      setRoomConfig(roomConfig);
      setPlayerMetadata(players);
      setGameData(gameData);

      setConnectedToRoom(true);
    }
  }, [
    dataFromBackend,
    setGameData,
    setPlayerMetadata,
    setRoomConfig,
    setConnectedToRoom,
    userID,
  ]);
}

export default useRejoinRoom;
