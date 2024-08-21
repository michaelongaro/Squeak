import { useEffect } from "react";
import { useRoomContext } from "~/context/RoomContext";
import { useUserIDContext } from "~/context/UserIDContext";
import { socket } from "~/pages/_app";

function useGracefullyReconnectToSocket() {
  const userID = useUserIDContext();

  const { roomConfig, connectedToRoom } = useRoomContext();

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

    socket.on("connect", handleGracefullyReconnectToRoom);

    return () => {
      socket.off("connect", handleGracefullyReconnectToRoom);
    };
  }, [roomConfig.code, connectedToRoom, userID]);
}

export default useGracefullyReconnectToSocket;
