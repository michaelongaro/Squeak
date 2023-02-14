import { type Server, type Socket } from "socket.io";
import { type IFriendsData, type IModifyFriendData } from "../socket";

export function modifyFriendDataHandler(
  io: Server,
  socket: Socket,
  friendData: IFriendsData
) {
  function modifyFriendData({
    action,
    initiatorID,
    targetID,
    roomCode,
  }: IModifyFriendData) {
    const initiator = friendData[initiatorID];
    const target = targetID ? friendData[targetID] : null;

    if (!initiator || !prisma) return;

    if (action === "sendFriendInvite" && targetID && target) {
      target.friendInviteIDs.push(initiatorID);

      prisma.user.update({
        where: {
          id: targetID,
        },
        data: {
          friendInviteIDs: target.friendInviteIDs,
        },
      });

      io.emit("friendDataUpdated", {
        playerID: targetID,
        friendData: target,
      });
    } else if (action === "acceptFriendInvite" && targetID && target) {
      initiator.friendIDs.push(targetID);
      target.friendIDs.push(initiatorID);

      initiator.friendInviteIDs = initiator.friendInviteIDs.filter(
        (id) => id !== targetID
      );

      prisma.user.update({
        where: {
          id: initiatorID,
        },
        data: {
          friendIDs: initiator.friendIDs,
          friendInviteIDs: initiator.friendInviteIDs,
        },
      });

      prisma.user.update({
        where: {
          id: targetID,
        },
        data: {
          friendIDs: target.friendIDs,
        },
      });

      io.emit("friendDataUpdated", {
        playerID: initiatorID,
        friendData: initiator,
      });

      io.emit("friendDataUpdated", {
        playerID: targetID,
        friendData: target,
      });
    } else if ((action === "createRoom" || action === "joinRoom") && roomCode) {
      prisma.user.update({
        where: {
          id: initiatorID,
        },
        data: {
          roomCode: roomCode,
        },
      });

      for (const friendID of initiator.friendIDs) {
        const friend = friendData[friendID];

        if (!friend) continue; // don't think this should ever happen but continue better than return here?

        io.emit("friendDataUpdated", {
          playerID: friendID,
          friendData: friend,
        });
      }
    }
  }
  socket.on("modifyFriendData", modifyFriendData);
}
