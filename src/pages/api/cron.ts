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
  console.log("hit");

  // Assuming your Socket.IO server is running on the same server but different port or path
  // Adjust the URL to match your actual Socket.IO server URL
  //  do we include the :8080? no way right?

  // also make sure this thing closes itself out after it's done
  const socket = io("https://playsqueak.com/", {
    path: "/api/socket",
  });

  socket.on("connect", async () => {
    console.log("Connected to the Socket.IO server as client");
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
      }, delay);
      delay += 5000;

      if (i === oldRooms.length - 1) {
        socket.close();
      }
    }
    // TODO: not the biggest fan of this delay setup, but should be semi-okay for now
    // honestly not sure if it's even needed, just didn't want to spam database with
    // too many operations at once

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
}
