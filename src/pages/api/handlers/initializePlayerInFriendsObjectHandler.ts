import { type Server, type Socket } from "socket.io";
import { type IFriendsData } from "../socket";
import { prisma } from "~/server/db";

export async function initializePlayerInFriendsObjectHandler(
  io: Server,
  socket: Socket,
  friendData: IFriendsData,
) {
  async function initializePlayer(playerID: string) {
    // check if playerID is in friendData, add the player if they are not
    if (friendData[playerID] === undefined) {
      // do prisma query that for playerID
      const user = await prisma.user.findUnique({
        where: {
          userId: playerID,
        },
        select: {
          friendIDs: true,
          friendInviteIDs: true,
          roomInviteIDs: true,
        },
      });

      if (!user) return;

      // set friendData to user's data
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
      friendData[playerID].socketID = socket.id;

      io.emit("friendDataUpdated", {
        playerID,
        friendData: friendData[playerID],
      });
    }

    if (!prisma) return;

    // always set user to online and status to "on main menu" when they initialize
    // fyi: this is probably flaky/not correct if user closed tab while in a game, and
    // now hits this while rejoining the game, for example
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

  socket.on("initializePlayerInFriendsObj", initializePlayer);
}
