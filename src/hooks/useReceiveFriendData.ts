import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { socket } from "~/lib/socket";
import { useUserIDContext } from "../context/UserIDContext";
import { useRoomContext } from "../context/RoomContext";
import { type IReceiveFriendData } from "~/types/socket";

function useReceiveFriendData() {
  const { isSignedIn } = useAuth();

  const userID = useUserIDContext();

  const {
    friendData,
    setFriendData,
    newInviteNotification,
    setNewInviteNotification,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IReceiveFriendData | null>(null);

  useEffect(() => {
    socket.on("friendDataUpdated", setDataFromBackend);

    return () => {
      socket.off("friendDataUpdated", setDataFromBackend);
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      const { friendData: newFriendData, playerID } = dataFromBackend;

      if (playerID === userID) {
        if (
          !newInviteNotification &&
          friendData?.friendInviteIDs &&
          newFriendData.friendInviteIDs.length >
            friendData.friendInviteIDs.length
        ) {
          setNewInviteNotification(true);

          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("You have a new friend invite");
          }
        }

        if (
          !newInviteNotification &&
          friendData?.roomInviteIDs &&
          newFriendData.roomInviteIDs.length > friendData.roomInviteIDs.length
        ) {
          setNewInviteNotification(true);

          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("You have a new room invite");
          }
        }

        setFriendData(newFriendData);
      }
    }
  }, [
    dataFromBackend,
    isSignedIn,
    userID,
    friendData,
    setFriendData,
    newInviteNotification,
    setNewInviteNotification,
  ]);
}

export default useReceiveFriendData;
