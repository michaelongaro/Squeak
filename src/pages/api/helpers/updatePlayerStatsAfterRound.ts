import { type IPlayerRoundDetails } from "../handlers/roundOverHandler";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface IUpdatePlayerStatsAfterRound {
  playerID: string;
  roundWinnerID: string;
  gameWinnerID: string | null;
  playerRoundDetails: IPlayerRoundDetails;
  playerRankForThisRound: number;
  playerScoreForThisRound: number;
}

export async function updatePlayerStatsAfterRound({
  playerID,
  playerRoundDetails,
  roundWinnerID,
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
  if (roundWinnerID === playerID) {
    playerStats.squeaks++;
  }

  // finishingPlace
  playerStats.allFinishedPlacesValues.push(playerRankForThisRound);

  // averagePlace
  playerStats.averageFinishingPlace =
    Math.round(
      (playerStats.allFinishedPlacesValues.reduce((a, b) => a + b, 0) /
        playerStats.allFinishedPlacesValues.length) *
        100
    ) / 100;

  // leftInSqueak
  playerStats.allLeftInSqueakValues.push(
    playerRoundDetails.squeakModifier === 10
      ? 0
      : Math.abs(playerRoundDetails.squeakModifier)
  );

  // averageLeftInSqueak
  playerStats.averageLeftInSqueak =
    Math.round(
      (playerStats.allLeftInSqueakValues.reduce((a, b) => a + b, 0) /
        playerStats.allLeftInSqueakValues.length) *
        100
    ) / 100;

  // lowestScore, hacky -> I would ideally want to set lowestScore and highestScore
  // to by default be null in the DB
  if (playerStats.totalRoundsPlayed === 0) {
    playerStats.lowestScore = playerScoreForThisRound;
  } else {
    playerStats.lowestScore =
      playerScoreForThisRound < playerStats.lowestScore
        ? playerScoreForThisRound
        : playerStats.lowestScore;
  }

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
      lowestScore: playerStats.lowestScore,
      highestScore: playerStats.highestScore,
      totalGamesPlayed: playerStats.totalGamesPlayed,
      totalRoundsPlayed: playerStats.totalRoundsPlayed,
    },
  });
}
