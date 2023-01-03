import { useState, useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useRoomContext } from "../../context/RoomContext";

let socket: Socket;

function Play() {
  const roomCtx = useRoomContext();

  const [sentReadyStatusToSocket, setSentReadyStatusToSocket] =
    useState<boolean>(false);

  useEffect(() => {
    if (!sentReadyStatusToSocket) {
      socket = io();

      socket.emit("playerReady", roomCtx.roomConfig.code);

      // add more socket listeners here

      // socket.on("roomConfigUpdated", (roomConfig) => {
      //   console.log("roomConfigUpdated: ", roomConfig);
      //   setRoomConfig(roomConfig);
      // });
      setSentReadyStatusToSocket(true);
    }

    // maybe you need to have a disconnect function that runs
    // when the component unmounts?
  }, [roomCtx, sentReadyStatusToSocket]);

  return (
    <div>
      <h1>Play</h1>
      <h2>Room Code: {roomCtx.roomConfig.code}</h2>
      <h2>Room Config: {JSON.stringify(roomCtx.roomConfig)}</h2>
      <h2>Player Metadata: {JSON.stringify(roomCtx.playerMetadata)}</h2>
    </div>
  );
}

export default Play;
