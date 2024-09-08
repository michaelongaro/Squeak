import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { socket } from "~/pages/_app";
import { type IReceiveFriendData } from "../pages/api/socket";
import { useMainStore } from "~/stores/MainStore";

function useReceiveFriendData() {
  const { isSignedIn } = useAuth();

  const {
    friendData,
    setFriendData,
    newInviteNotification,
    setNewInviteNotification,
    userID,
  } = useMainStore((state) => ({
    friendData: state.friendData,
    setFriendData: state.setFriendData,
    newInviteNotification: state.newInviteNotification,
    setNewInviteNotification: state.setNewInviteNotification,
    userID: state.userID,
  }));

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

      const { friendData: newFriendData, playerID } = dataFromBackend;

      if (playerID === userID) {
        // send "go online" emit if friendData hasn't been initialized yet
        if (isSignedIn && friendData === undefined) {
          socket.volatile.emit("modifyFriendData", {
            action: "goOnline",
            initiatorID: userID,
          });
        }

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
