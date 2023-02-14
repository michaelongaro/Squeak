import { useState, useEffect } from "react";
import { useRoomContext } from "../context/RoomContext";
import { useUserIDContext } from "../context/UserIDContext";
import { socket } from "../pages";
import { type IReceiveFriendData } from "../pages/api/socket";

function useReceiveFriendData() {
  const { value: userID } = useUserIDContext();

  const { setFriendData } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IReceiveFriendData | null>(null);

  useEffect(() => {
    socket.on("friendDataUpdated", (data) => setDataFromBackend(data));

    return () => {
      socket.off("friendDataUpdated", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { playerID, friendData } = dataFromBackend;

      if (playerID === userID) {
        setFriendData(friendData);
      }
    }
  }, [dataFromBackend, userID, setFriendData]);
}

export default useReceiveFriendData;
