import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { type IRejoinData } from "./../pages/api/socket";
import { useMainStore } from "~/stores/MainStore";
import useGetUserID from "~/hooks/useGetUserID";

// this hook has auth hook in it but I think it was just from a copy paste
// from another hook to get a boilerplate

function useRejoinRoom() {
  const userID = useGetUserID();

  const { setRoomConfig, setPlayerMetadata, setGameData, connectedToRoom } =
    useMainStore((state) => ({
      setRoomConfig: state.setRoomConfig,
      setPlayerMetadata: state.setPlayerMetadata,
      setGameData: state.setGameData,
      connectedToRoom: state.connectedToRoom,
    }));

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
