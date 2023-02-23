import {
  type IPlayerRankings,
  type IPlayerRoundDetails,
} from "../handlers/roundOverHandler";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface IUpdatePlayerStatsAfterRound {
  roundWinnerID: string;
  gameWinnerID: string | null;
  playerRoundDetails: IPlayerRoundDetails;
  playerRankingsForThisRound: IPlayerRankings;
}

export async function updatePlayerStatsAfterRound({
  playerRoundDetails,
  roundWinnerID,
  gameWinnerID,
  playerRankingsForThisRound,
}: IUpdatePlayerStatsAfterRound) {
  if (!prisma) return;

  const playerStats = await prisma.stats
    .findUnique({
      where: {
        userID: playerRoundDetails.playerID,
      },
    })
    .catch((err) => console.log(err));

  // return early if playerID doesn't exist on Stats table
  if (!playerStats) return;

  // modify all appropriate properties

  // squeaks
  if (roundWinnerID === playerRoundDetails.playerID) {
    playerStats.squeaks++;
  }

  // finishingPlace
  const finishingPlace =
    playerRankingsForThisRound[playerRoundDetails.playerID];
  if (finishingPlace) playerStats.allFinishedPlacesValues.push(finishingPlace);

  // averagePlace
  playerStats.averageFinishingPlace =
    playerStats.allFinishedPlacesValues.reduce((a, b) => a + b, 0) /
    playerStats.allFinishedPlacesValues.length;

  // leftInSqueak
  playerStats.allLeftInSqueakValues.push(
    playerRoundDetails.squeakModifier === 10
      ? 0
      : Math.abs(playerRoundDetails.squeakModifier)
  );

  // averageLeftInSqueak
  playerStats.averageLeftInSqueak =
    playerStats.allLeftInSqueakValues.reduce((a, b) => a + b, 0) /
    playerStats.allLeftInSqueakValues.length;

  // lowestScore
  playerStats.lowestScore =
    playerRoundDetails.newScore < playerStats.lowestScore
      ? playerRoundDetails.newScore
      : playerStats.lowestScore;

  // highestScore
  playerStats.highestScore =
    playerRoundDetails.newScore > playerStats.highestScore
      ? playerRoundDetails.newScore
      : playerStats.highestScore;

  // totalGamesPlayed
  if (gameWinnerID) {
    playerStats.totalGamesPlayed++;
  }

  // totalRoundsPlayed
  playerStats.totalRoundsPlayed++;

  // prisma call to update Stats(userID)
  prisma.stats.update({
    where: {
      userID: playerRoundDetails.playerID,
    },
    data: playerStats,
  });
}
