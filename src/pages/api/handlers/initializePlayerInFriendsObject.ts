import { type Server, type Socket } from "socket.io";
import { type IFriendsData } from "../socket";
import { prisma } from "~/server/db";

export async function initializePlayerInFriendsObject(
  io: Server,
  socket: Socket,
  friendData: IFriendsData,
) {
  async function initializePlayer(playerID: string) {
    if (!prisma) return;

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
  }

  socket.on("initializePlayerInFriendsObj", initializePlayer);
}
