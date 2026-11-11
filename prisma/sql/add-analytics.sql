-- Additive and safe to rerun for existing databases managed with prisma db push.
CREATE TABLE IF NOT EXISTS "Analytics" (
    "date" DATE NOT NULL,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "roomsCreated" INTEGER NOT NULL DEFAULT 0,
    "gamesStarted" INTEGER NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "roundsStarted" INTEGER NOT NULL DEFAULT 0,
    "roundsPlayed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("date")
);
