import { type Server, type Socket } from "socket.io";
import { type IFriendsData } from "../socket";
import { prisma } from "~/server/db";

export async function initializePlayerInFriendsObjectHandler(
  io: Server,
  socket: Socket,
  friendData: IFriendsData,
) {
  async function initializePlayer(playerID: string) {
    // if friendData has no keys (first call since server has started)
    if (Object.keys(friendData).length === 0) {
      // do prisma query that gives the whole users object
      // set friendData to user's data
      const users = await prisma.user.findMany({
        select: {
          userId: true,
          friendIDs: true,
          friendInviteIDs: true,
          roomInviteIDs: true,
        },
      });

      users.forEach((user) => {
        friendData[user.userId] = {
          socketID: socket.id,
          friendIDs: user.friendIDs,
          friendInviteIDs: user.friendInviteIDs,
          roomInviteIDs: user.roomInviteIDs,
        };
      });

      io.emit("friendDataUpdated", {
        playerID,
        friendData: friendData[playerID],
      });
    }

    // else check if playerID is in friendData
    else if (friendData[playerID] === undefined) {
      // do prisma query that for playerID
      // set friendData to user's data
      const user = await prisma.user.findUnique({
        where: {
          id: playerID,
        },
        select: {
          friendIDs: true,
          friendInviteIDs: true,
          roomInviteIDs: true,
        },
      });

      if (!user) return;

      friendData[playerID] = {
        socketID: socket.id,
        friendIDs: user.friendIDs,
        friendInviteIDs: user.friendInviteIDs,
        roomInviteIDs: user.roomInviteIDs,
      };

      io.emit("friendDataUpdated", {
        playerID,
        friendData: friendData[playerID],
      });
    }

    // player already in friendData
    else {
      io.emit("friendDataUpdated", {
        playerID,
        friendData: friendData[playerID],
      });
    }

    if (!prisma) return;

    await prisma.user
      .update({
        where: {
          userId: playerID,
        },
        data: {
          online: true,
          status: "on main menu",
        },
      })
      .catch((err) => console.log(err));
  }

  // socket.on("initializePlayerInFriendsObj", initializePlayer);
  socket.on("initializePlayerInFriendsObj", (playerID) => {
    console.log(
      "Received initializePlayerInFriendsObj event for playerID:",
      playerID,
    );
    initializePlayer(playerID);
  });
}
