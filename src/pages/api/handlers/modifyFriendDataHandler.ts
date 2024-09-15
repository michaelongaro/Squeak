import { type Server, type Socket } from "socket.io";
import { type IFriendsData, type IModifyFriendData } from "../socket";
import { prisma } from "~/server/db";

export function modifyFriendDataHandler(
  io: Server,
  socket: Socket,
  friendData: IFriendsData,
) {
  async function modifyFriendData({
    action,
    initiatorID,
    targetID,
    roomCode,
    currentRoomIsPublic,
    currentRoomIsFull,
  }: IModifyFriendData) {
    const initiator = friendData[initiatorID];
    const target = targetID ? friendData[targetID] : null;

    if (!initiator || !prisma) return;

    if (action === "sendFriendInvite" && targetID && target) {
      target.friendInviteIDs.push(initiatorID);

      await prisma.user
        .update({
          where: {
            userId: targetID,
          },
          data: {
            friendInviteIDs: target.friendInviteIDs,
          },
        })
        .catch((err) => console.log(err));

      io.emit("friendDataUpdated", {
        playerID: targetID,
        friendData: target,
      });
    } else if (action === "acceptFriendInvite" && targetID && target) {
      initiator.friendIDs.push(targetID);
      target.friendIDs.push(initiatorID);

      initiator.friendInviteIDs = initiator.friendInviteIDs.filter(
        (id) => id !== targetID,
      );

      await prisma.user
        .update({
          where: {
            userId: initiatorID,
          },
          data: {
            friendIDs: initiator.friendIDs,
            friendInviteIDs: initiator.friendInviteIDs,
          },
        })
        .catch((err) => console.log(err));

      await prisma.user
        .update({
          where: {
            userId: targetID,
          },
          data: {
            friendIDs: target.friendIDs,
          },
        })
        .catch((err) => console.log(err));

      io.emit("friendDataUpdated", {
        playerID: initiatorID,
        friendData: initiator,
      });

      io.emit("friendDataUpdated", {
        playerID: targetID,
        friendData: target,
      });
    } else if (action === "declineFriendInvite") {
      initiator.friendInviteIDs = initiator.friendInviteIDs.filter(
        (id) => id !== targetID,
      );

      await prisma.user
        .update({
          where: {
            userId: initiatorID,
          },
          data: {
            friendInviteIDs: initiator.friendInviteIDs,
          },
        })
        .catch((err) => console.log(err));

      io.emit("friendDataUpdated", {
        playerID: initiatorID,
        friendData: initiator,
      });
    } else if (action === "sendRoomInvite" && targetID && target) {
      target.roomInviteIDs.push(initiatorID);

      await prisma.user
        .update({
          where: {
            userId: targetID,
          },
          data: {
            roomInviteIDs: target.roomInviteIDs,
          },
        })
        .catch((err) => console.log(err));

      io.emit("friendDataUpdated", {
        playerID: targetID,
        friendData: target,
      });
    } else if (
      action === "acceptRoomInvite" &&
      targetID &&
      target &&
      roomCode !== undefined &&
      currentRoomIsPublic !== undefined
    ) {
      initiator.roomInviteIDs = initiator.roomInviteIDs.filter(
        (id) => id !== targetID,
      );

      await prisma.user
        .update({
          where: {
            userId: initiatorID,
          },
          data: {
            roomInviteIDs: initiator.roomInviteIDs,
            status: "in a room",
            roomCode: roomCode,
            currentRoomIsPublic: currentRoomIsPublic,
          },
        })
        .catch((err) => console.log(err));

      io.emit("friendDataUpdated", {
        playerID: initiatorID,
        friendData: initiator,
      });

      for (const friendID of initiator.friendIDs) {
        const friend = friendData[friendID];

        if (!friend) continue; // don't think this should ever happen but continue better than return here?

        io.emit("friendDataUpdated", {
          playerID: friendID,
          friendData: friend,
        });
      }
    } else if (action === "declineRoomInvite" && targetID) {
      initiator.roomInviteIDs = initiator.roomInviteIDs.filter(
        (id) => id !== targetID,
      );

      await prisma.user
        .update({
          where: {
            userId: initiatorID,
          },
          data: {
            roomInviteIDs: initiator.roomInviteIDs,
          },
        })
        .catch((err) => console.log(err));

      io.emit("friendDataUpdated", {
        playerID: initiatorID,
        friendData: initiator,
      });
    } else if (action === "removeFriend" && targetID && target) {
      initiator.friendIDs = initiator.friendIDs.filter((id) => id !== targetID);

      target.friendIDs = target.friendIDs.filter((id) => id !== initiatorID);

      await prisma.user
        .update({
          where: {
            userId: initiatorID,
          },
          data: {
            friendIDs: initiator.friendIDs,
          },
        })
        .catch((err) => console.log(err));

      await prisma.user
        .update({
          where: {
            userId: targetID,
          },
          data: {
            friendIDs: target.friendIDs,
          },
        })
        .catch((err) => console.log(err));

      io.emit("friendDataUpdated", {
        playerID: initiatorID,
        friendData: initiator,
      });

      io.emit("friendDataUpdated", {
        playerID: targetID,
        friendData: target,
      });
    } else if (
      (action === "createRoom" || action === "joinRoom") &&
      roomCode !== undefined &&
      currentRoomIsPublic !== undefined
    ) {
      await prisma.user
        .update({
          where: {
            userId: initiatorID,
          },
          data: {
            status: "in a room",
            roomCode: roomCode,
            currentRoomIsPublic: currentRoomIsPublic,
          },
        })
        .catch((err) => console.log(err));

      for (const friendID of initiator.friendIDs) {
        const friend = friendData[friendID];

        if (!friend) continue; // don't think this should ever happen but continue better than return here?

        io.emit("friendDataUpdated", {
          playerID: friendID,
          friendData: friend,
        });
      }
    } else if (
      action === "roomMetadataUpdate" &&
      (currentRoomIsPublic !== undefined || currentRoomIsFull !== undefined)
    ) {
      if (currentRoomIsPublic !== undefined) {
        await prisma.user
          .update({
            where: {
              userId: initiatorID,
            },
            data: {
              currentRoomIsPublic: currentRoomIsPublic,
            },
          })
          .catch((err) => console.log(err));
      }

      if (currentRoomIsFull !== undefined) {
        await prisma.user
          .update({
            where: {
              userId: initiatorID,
            },
            data: {
              currentRoomIsFull: currentRoomIsFull,
            },
          })
          .catch((err) => console.log(err));
      }

      for (const friendID of initiator.friendIDs) {
        const friend = friendData[friendID];

        if (!friend) continue; // don't think this should ever happen but continue better than return here?

        io.emit("friendDataUpdated", {
          playerID: friendID,
          friendData: friend,
        });
      }
    } else if (action === "startGame") {
      await prisma.user
        .update({
          where: {
            userId: initiatorID,
          },
          data: {
            status: "in a game",
          },
        })
        .catch((err) => console.log(err));

      for (const friendID of initiator.friendIDs) {
        const friend = friendData[friendID];

        if (!friend) continue; // don't think this should ever happen but continue better than return here?

        io.emit("friendDataUpdated", {
          playerID: friendID,
          friendData: friend,
        });
      }
    } else if (action === "leaveRoom") {
      await prisma.user
        .update({
          where: {
            userId: initiatorID,
          },
          data: {
            status: "on main menu",
            roomCode: null,
            currentRoomIsPublic: null,
          },
        })
        .catch((err) => console.log(err));

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
