import { useEffect, useCallback } from "react";
import { useRoomContext } from "../context/RoomContext";
import { useUserIDContext } from "../context/UserIDContext";
import { socket } from "../pages";
import { type IReceiveFriendData } from "../pages/api/socket";

function useReceiveFriendData() {
  const { value: userID } = useUserIDContext();

  const {
    friendData,
    setFriendData,
    newInviteNotification,
    setNewInviteNotification,
  } = useRoomContext();

  const handleFriendData = useCallback(
    ({ friendData: newFriendData, playerID }: IReceiveFriendData) => {
      if (playerID === userID) {
        if (
          !newInviteNotification &&
          friendData?.friendInviteIDs &&
          newFriendData.friendInviteIDs.length >
            friendData.friendInviteIDs.length
        ) {
          setNewInviteNotification(true);

          if (Notification.permission === "granted") {
            new Notification("You have a new friend invite");
          }
        }

        if (
          !newInviteNotification &&
          friendData?.roomInviteIDs &&
          newFriendData.roomInviteIDs.length > friendData.roomInviteIDs.length
        ) {
          setNewInviteNotification(true);

          if (Notification.permission === "granted") {
            new Notification("You have a new room invite");
          }
        }
        setFriendData(newFriendData);
      }
    },
    [
      userID,
      friendData,
      setFriendData,
      newInviteNotification,
      setNewInviteNotification,
    ]
  );

  useEffect(() => {
    socket.on("friendDataUpdated", (data) => handleFriendData(data));

    return () => {
      socket.off("friendDataUpdated", (data) => handleFriendData(data));
    };
  }, [handleFriendData]);
}

export default useReceiveFriendData;
