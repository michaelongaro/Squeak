import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "~/server/db";
import { env } from "~/env";
import { removeRoomState } from "~/server/socket/state";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ status: "error", message: "Method not allowed" });
  }

  const body: unknown = req.body;
  if (
    !body ||
    typeof body !== "object" ||
    !("secret" in body) ||
    body.secret !== env.CRON_JOB_SECRET
  ) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  try {
    const oldRooms = await prisma.room.findMany({
      where: { createdAt: { lte: new Date(Date.now() - 4 * 60 * 60 * 1000) } },
      select: { code: true },
    });

    await prisma.room.deleteMany({
      where: { code: { in: oldRooms.map((room) => room.code) } },
    });
    for (const room of oldRooms) removeRoomState(room.code);

    return res
      .status(200)
      .json({ status: "success", message: "Action performed successfully" });
  } catch (error) {
    console.error("Unexpected error in cron handler:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
}
