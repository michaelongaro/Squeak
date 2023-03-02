import { type Server, type Socket } from "socket.io";
import {
  createAndFormatDeck,
  type ICard,
} from "../../../utils/generateDeckAndSqueakCards";
import { updatePlayerStatsAfterRound } from "../helpers/updatePlayerStatsAfterRound";
import {
  type IGameData,
  type IRoomData,
  type IGameMetadata,
  type IRoundOver,
} from "../socket";

export interface IScoreboardMetadata {
  gameWinnerID: string | null;
  roundWinnerID: string;
  playerRoundDetails: IPlayerRoundDetailsMetadata;
}

export interface IPlayerRoundDetailsMetadata {
  [playerID: string]: IPlayerRoundDetails;
}

export interface IPlayerRoundDetails {
  playerID: string;
  cardsPlayed: ICard[];
  squeakModifier: number;
  oldScore: number;
  newScore: number;
  oldRanking: number;
  newRanking: number;
}

export interface IPlayerRankings {
  [playerID: string]: number;
}

export function roundOverHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData
) {
  function generateAndEmitScoreboard({ roundWinnerID, roomCode }: IRoundOver) {
    const playerCards = gameData[roomCode]?.players;
    const pointsToWin = roomData[roomCode]?.roomConfig.pointsToWin;

    if (!playerCards || !pointsToWin) return;

    const playerRoundDetails = {} as IPlayerRoundDetailsMetadata;

    const playerScoresForThisRound: [string, number][] = [];
    const playerRanksForThisRound = {} as IPlayerRankings;

    // calculate final score for each player from this round
    for (const playerID of Object.keys(playerCards)) {
      const player = playerCards[playerID];

      if (!player) return;

      const deckCards = player.deck;
      const squeakDeckCards = player.squeakDeck;
      const squeakHandCards = player.squeakHand.flat();

      const cardsPlayed = calculateCardsPlayedDuringRound(
        deckCards,
        squeakDeckCards,
        squeakHandCards
      );

      const squeakModifier =
        squeakDeckCards.length === 0 ? 10 : squeakDeckCards.length * -1;

      playerScoresForThisRound.push([
        playerID,
        cardsPlayed.length + squeakModifier,
      ]);
    }

    // calculate and store playerRoundDetails for each player
    for (const playerID of Object.keys(playerCards)) {
      const player = playerCards[playerID];

      if (!player) return;

      const deckCards = player.deck;
      const squeakDeckCards = player.squeakDeck;
      const squeakHandCards = player.squeakHand.flat();

      const cardsPlayed = calculateCardsPlayedDuringRound(
        deckCards,
        squeakDeckCards,
        squeakHandCards
      );

      const squeakModifier =
        squeakDeckCards.length === 0 ? 10 : squeakDeckCards.length * -1;
      const oldScore = player.totalPoints;
      const newScore = oldScore + cardsPlayed.length + squeakModifier;
      const oldRanking = player.rankInRoom;
      const newRanking = oldRanking; // we calculate this value down later once playerRoundDetails is populated

      playerRoundDetails[playerID] = {
        playerID,
        cardsPlayed,
        squeakModifier,
        oldScore,
        newScore,
        oldRanking,
        newRanking,
      };
    }

    // calculate new total scores for each player
    const newPlayerRanks: [string, number][] = [];

    for (const playerID of Object.keys(playerCards)) {
      const player = playerCards[playerID];

      const idx = playerScoresForThisRound.findIndex(
        (playerRank) => playerRank[0] === playerID
      );

      const currPlayerRoundDetails = playerRoundDetails[playerID];

      const currPlayerScoreForThisRound = playerScoresForThisRound[idx];

      if (
        !player ||
        !currPlayerRoundDetails ||
        !currPlayerScoreForThisRound ||
        !playerScoresForThisRound
      )
        return;

      newPlayerRanks.push([
        playerID,
        currPlayerRoundDetails.oldScore + currPlayerScoreForThisRound[1],
      ]);
    }

    // adding sorted ranks for this round + overall new ranks to playerRoundDetails
    for (const playerID of Object.keys(playerCards)) {
      const player = playerCards[playerID];

      if (!player || !playerRoundDetails) return;

      playerRoundDetails[playerID]!.newRanking =
        newPlayerRanks
          .sort((a, b) => b[1] - a[1])
          .findIndex((playerRank) => playerRank[0] === playerID) + 1;

      playerRanksForThisRound[playerID] =
        playerScoresForThisRound
          .sort((a, b) => b[1] - a[1])
          .findIndex((playerRank) => playerRank[0] === playerID) + 1;
    }

    // updating players in gameData with their new values
    for (const playerID of Object.keys(playerCards)) {
      const player = playerCards[playerID];

      if (!player || !playerRoundDetails) return;

      // @ts-expect-error asdf
      player.totalPoints = playerRoundDetails[playerID].newScore;
      // @ts-expect-error asdf
      player.rankInRoom = playerRoundDetails[playerID].newRanking;
    }

    let gameWinnerID = null;

    // check if player has won the game
    for (const playerID of Object.keys(playerCards)) {
      const player = playerCards[playerID];

      if (!player) return;

      if (player.totalPoints >= pointsToWin) {
        gameWinnerID = playerID;
      }
    }

    // updating stats for each user in the room
    for (const playerID of Object.keys(playerRoundDetails)) {
      updatePlayerStatsAfterRound({
        playerID,
        playerRoundDetails: playerRoundDetails[playerID]!,
        roundWinnerID,
        gameWinnerID,
        playerRankForThisRound: playerRanksForThisRound[playerID]!,
      });
    }

    io.in(roomCode).emit("scoreboardMetadata", {
      roundWinnerID,
      gameWinnerID,
      playerRoundDetails,
    });
  }

  socket.on("roundOver", generateAndEmitScoreboard);
}

function calculateCardsPlayedDuringRound(
  cardsLeftInDeck: ICard[],
  cardsLeftInSqueakDeck: ICard[],
  cardsLeftInSqueakHands: ICard[]
): ICard[] {
  const fullDeck = createAndFormatDeck();

  const allCardsNotPlayedOnBoard = [
    ...cardsLeftInDeck,
    ...cardsLeftInSqueakDeck,
    ...cardsLeftInSqueakHands,
  ];

  const cardsPlayed = fullDeck.filter((item) => {
    for (let i = 0; i < allCardsNotPlayedOnBoard.length; i++) {
      if (
        item.suit === allCardsNotPlayedOnBoard[i]!.suit &&
        item.value === allCardsNotPlayedOnBoard[i]!.value
      ) {
        return false;
      }
    }
    return true;
  });

  return cardsPlayed;
}
