import { useState, useEffect, useCallback } from "react";
import { useRoomContext } from "../context/RoomContext";
import { useUserIDContext } from "../context/UserIDContext";
import { socket } from "../pages";
import { type IReceiveFriendData } from "../pages/api/socket";

function useReceiveFriendData() {
  const { value: userID } = useUserIDContext();

  const { setFriendData } = useRoomContext();

  const handleFriendData = useCallback(
    ({ friendData, playerID }: IReceiveFriendData) => {
      if (playerID === userID) {
        setFriendData(friendData);
      }
    },
    [userID, setFriendData]
  );

  useEffect(() => {
    socket.on("friendDataUpdated", (data) => handleFriendData(data));

    return () => {
      socket.off("friendDataUpdated", (data) => handleFriendData(data));
    };
  }, [userID, setFriendData, handleFriendData]);
}

export default useReceiveFriendData;
