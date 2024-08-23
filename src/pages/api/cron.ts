import { type NextApiRequest, type NextApiResponse } from "next";
import { io } from "socket.io-client";
import { prisma } from "~/server/db";
import { env } from "~/env";

export const config = {
  api: {
    responseLimit: false,
    externalResolver: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.body.secret !== env.CRON_JOB_SECRET) {
      return res.status(401).json({
        status: "error",
        message: `Unauthorized, ${req.body.secret} ${env.CRON_JOB_SECRET}`,
      });
    }

    const socket = io(req.body.basePath, {
      path: "/api/socket",
    });

    socket.on("connect", async () => {
      console.log("Socket connected to cron");

      // room is considered old if it was created >= 4 hours ago
      const oldRooms = await prisma.room.findMany({
        where: {
          createdAt: {
            lte: new Date(Date.now() - 1000 * 60 * 60 * 4),
          },
        },
        select: {
          code: true,
        },
      });

      // Function to emit a single room cleanup event and wait for acknowledgment
      const emitCleanup = (code: string) => {
        return new Promise<void>((resolve) => {
          socket.emit("oldRoomCleanupCron", code, () => {
            resolve();
          });
        });
      };

      // For parallel:
      await Promise.allSettled(
        oldRooms.map((room) => room?.code && emitCleanup(room.code)),
      );

      // Close the socket after all emits are completed
      socket.close();

      res.status(200).json({
        status: "success",
        message: "Action performed successfully",
      });
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
  } catch (error) {
    console.error("Unexpected error in cron handler:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}
