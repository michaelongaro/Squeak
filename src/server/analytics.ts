import { prisma } from "~/server/db";

type AnalyticsMetric =
  | "pageViews"
  | "roomsCreated"
  | "gamesStarted"
  | "gamesPlayed"
  | "roundsStarted"
  | "roundsPlayed";

// Atomic increments avoid losing counts when events arrive concurrently.
// Analytics failures must never interrupt gameplay.
export async function recordAnalytics(
  increments: Partial<Record<AnalyticsMetric, number>>,
  now = new Date(),
): Promise<boolean> {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const counts = {
    pageViews: increments.pageViews ?? 0,
    roomsCreated: increments.roomsCreated ?? 0,
    gamesStarted: increments.gamesStarted ?? 0,
    gamesPlayed: increments.gamesPlayed ?? 0,
    roundsStarted: increments.roundsStarted ?? 0,
    roundsPlayed: increments.roundsPlayed ?? 0,
  };
  const update = Object.fromEntries(
    Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([metric, count]) => [metric, { increment: count }]),
  );
  if (Object.keys(update).length === 0) return true;

  try {
    await prisma.analytics.upsert({
      where: { date },
      create: { date, ...counts },
      update,
    });
    return true;
  } catch (error) {
    console.error("Failed to record analytics:", error);
    return false;
  }
}
