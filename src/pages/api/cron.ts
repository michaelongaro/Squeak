import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "~/server/db";
import { env } from "~/env";
import { socket } from "~/pages/_app";

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
        message: "Unauthorized",
      });
    }

    console.log("cron job starting");

    socket.on("connect", async () => {
      console.log("Connected to the Socket.IO server as cron client");

      try {
        const oldRooms = await prisma.room.findMany({
          where: {
            createdAt: {
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
              socket.volatile.emit("oldRoomCleanupCron", { code });
            }

            if (i === oldRooms.length - 1) {
              socket.close();
            }
          }, delay);
          delay += 5000;
        }
        res.status(200).json({
          status: "success",
          message: "Action performed successfully",
        });
      } catch (error) {
        console.error("Error processing old rooms:", error);
        res.status(500).json({
          status: "error",
          message: "Error processing old rooms",
        });
      }
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
