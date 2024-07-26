import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IRejoinData } from "./../pages/api/socket";

// this hook has auth hook in it but I think it was just from a copy paste
// from another hook to get a boilerplate

function useRejoinRoom() {
  const userID = useUserIDContext();

  const { setRoomConfig, setPlayerMetadata, setGameData, connectedToRoom } =
    useRoomContext();

  const [dataFromBackend, setDataFromBackend] = useState<IRejoinData | null>(
    null,
  );

  useEffect(() => {
    if (!connectedToRoom) return; // probably keeping but not sure yet

    socket.on("rejoinData", (data) => setDataFromBackend(data));

    return () => {
      socket.off("rejoinData", (data) => setDataFromBackend(data));
    };
  }, [connectedToRoom]);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const {
        userID: userIDFromBackend,
        roomConfig,
        gameData,
        players,
      } = dataFromBackend;

      if (userID !== userIDFromBackend) return;

      setRoomConfig(roomConfig);
      setPlayerMetadata(players);
      setGameData(gameData);
    }
  }, [dataFromBackend, setGameData, setPlayerMetadata, setRoomConfig, userID]);
}

export default useRejoinRoom;
