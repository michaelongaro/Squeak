import { type Server, type Socket } from "socket.io";
import { type IFriendsData } from "../socket";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function initializeAuthorizedPlayerInFriendsObject(
  io: Server,
  socket: Socket,
  friendData: IFriendsData
) {
  async function initializeAuthorizedPlayer(playerID: string) {
    if (!prisma) return;

    // if friendData has no keys, do below:
    if (Object.keys(friendData).length === 0) {
      // do prisma query that gives the whole(?) users object
      // set friendData to user's data
      const users = await prisma.user.findMany();

      users.forEach((user) => {
        friendData[user.id] = {
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
    else if (!friendData[playerID]) {
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

  socket.on("initializeAuthorizedPlayer", initializeAuthorizedPlayer);
}
