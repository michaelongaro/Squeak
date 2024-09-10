import { useEffect } from "react";
import { socket } from "~/pages/_app";
import { useMainStore } from "~/stores/MainStore";

function useGracefullyReconnectToSocket() {
  const { roomConfig, connectedToRoom, userID } = useMainStore((state) => ({
    roomConfig: state.roomConfig,
    connectedToRoom: state.connectedToRoom,
    userID: state.userID,
  }));

  // by their nature, websocket connections close and reopen
  // on their own, so we need to listen for the "connect" event
  // to attempt to reconnect to the user's room if they were previously
  // connected to a room prior to the websocket connection closing

  useEffect(() => {
    function handleGracefullyReconnectToRoom() {
      if (userID && connectedToRoom && roomConfig.code) {
        socket.emit("attemptToGracefullyReconnectToRoom", {
          roomCode: roomConfig.code,
          userID,
        });
      }
    }

    function handleForceReload() {
      window.location.reload();
    }

    socket.on("connect", handleGracefullyReconnectToRoom);
    socket.on("forceReload", handleForceReload);

    return () => {
      socket.off("connect", handleGracefullyReconnectToRoom);
      socket.off("forceReload", handleForceReload);
    };
  }, [roomConfig.code, connectedToRoom, userID]);
}

export default useGracefullyReconnectToSocket;
