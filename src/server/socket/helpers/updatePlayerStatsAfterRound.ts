import { type IPlayerRoundDetails } from "~/types/socket";
import { prisma } from "~/server/db";

interface IUpdatePlayerStatsAfterRound {
  playerID: string;
  playerWhoSqueakedID: string;
  gameWinnerID: string | null;
  playerRoundDetails: IPlayerRoundDetails;
  playerRankForThisRound: number;
  playerScoreForThisRound: number;
}

export async function updatePlayerStatsAfterRound({
  playerID,
  playerRoundDetails,
  playerWhoSqueakedID,
  gameWinnerID,
  playerRankForThisRound,
  playerScoreForThisRound,
}: IUpdatePlayerStatsAfterRound) {
  if (!prisma) return;

  const playerStats = await prisma.stats
    .findUnique({
      where: {
        userID: playerID,
      },
    })
    .catch((err) => console.log(err));

  // return early if playerID doesn't exist on Stats table
  if (!playerStats) return;

  // modify all appropriate properties

  // squeaks
  if (playerWhoSqueakedID === playerID) {
    playerStats.squeaks++;
  }

  // finishingPlace
  playerStats.allFinishedPlacesValues.push(playerRankForThisRound);

  // averagePlace
  playerStats.averageFinishingPlace =
    Math.round(
      (playerStats.allFinishedPlacesValues.reduce((a, b) => a + b, 0) /
        playerStats.allFinishedPlacesValues.length) *
        100,
    ) / 100;

  // leftInSqueak
  playerStats.allLeftInSqueakValues.push(
    playerRoundDetails.squeakModifier === 10
      ? 0
      : Math.abs(playerRoundDetails.squeakModifier),
  );

  // averageLeftInSqueak
  playerStats.averageLeftInSqueak =
    Math.round(
      (playerStats.allLeftInSqueakValues.reduce((a, b) => a + b, 0) /
        playerStats.allLeftInSqueakValues.length) *
        100,
    ) / 100;

  // highestScore
  playerStats.highestScore =
    playerScoreForThisRound > playerStats.highestScore
      ? playerScoreForThisRound
      : playerStats.highestScore;

  // totalGamesPlayed
  if (gameWinnerID) {
    playerStats.totalGamesPlayed++;
  }

  // totalRoundsPlayed
  playerStats.totalRoundsPlayed++;

  // prisma call to update Stats(userID)
  await prisma.stats.update({
    where: {
      id: playerStats.id,
    },
    data: {
      squeaks: playerStats.squeaks,
      allFinishedPlacesValues: playerStats.allFinishedPlacesValues,
      averageFinishingPlace: playerStats.averageFinishingPlace,
      allLeftInSqueakValues: playerStats.allLeftInSqueakValues,
      averageLeftInSqueak: playerStats.averageLeftInSqueak,
      highestScore: playerStats.highestScore,
      totalGamesPlayed: playerStats.totalGamesPlayed,
      totalRoundsPlayed: playerStats.totalRoundsPlayed,
    },
  });
}
