import { type Server, type Socket } from "socket.io";
import { type IFriendsData } from "../socket";
import { prisma } from "~/server/db";

export async function goOfflineHandler(
  io: Server,
  socket: Socket,
  friendData: IFriendsData,
) {
  socket.on("disconnect", async (reason) => {
    let userIDThatDisconnected = null;
    let userThatDisconnected = null;

    // find the player who disconnected
    for (const [userID, player] of Object.entries(friendData)) {
      if (player.socketID === socket.id) {
        userIDThatDisconnected = userID;
        userThatDisconnected = player;
        break;
      }
    }

    if (!userIDThatDisconnected || !userThatDisconnected || !prisma) return;

    await prisma.user
      .update({
        where: {
          userId: userIDThatDisconnected,
        },
        data: {
          online: false,
          status: "on main menu",
          roomCode: null,
          currentRoomIsPublic: null,
        },
      })
      .catch((err) => console.log(err));

    for (const friendID of userThatDisconnected.friendIDs) {
      const friend = friendData[friendID];

      if (!friend) continue; // don't think this should ever happen but continue better than return here?

      io.emit("friendDataUpdated", {
        playerID: friendID,
        friendData: friend,
      });
    }
  });
}
