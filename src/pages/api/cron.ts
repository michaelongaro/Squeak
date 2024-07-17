// pages/api/cron.ts

import { type NextApiRequest, type NextApiResponse } from "next";
import { io } from "socket.io-client";
import { prisma } from "~/server/db";

export const config = {
  api: {
    externalResolver: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("cron job starting");

  const socket = io("https://playsqueak.com:8080", {
    // ^ do we include the :8080?
    path: "/api/socket",
  });

  socket.on("connect", async () => {
    console.log("Connected to the Socket.IO server as cron client");
    console.dir(socket);

    const oldRooms = await prisma.room.findMany({
      where: {
        createdAt: {
          // >= 24 hours ago
          lte: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      },
      select: {
        code: true,
      },
    });

    let delay = 5000;
    for (let i = 0; i < oldRooms.length; i++) {
      setTimeout(() => {
        const code = oldRooms[i]?.code;
        if (code) {
          socket.emit("oldRoomCleanupCron", { code });
        }

        // Close the socket after the last room is processed
        if (i === oldRooms.length - 1) {
          socket.close();
        }
      }, delay);
      delay += 5000;
    }
    // ^ unsure of if delay is necessary

    res
      .status(200)
      .json({ status: "success", message: "Action performed successfully" });
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to connect to Socket.IO server",
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected from cron");
  });
}
