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

export interface IPlayerRoundDetails {
  playerID: string;
  cardsPlayed: ICard[];
  squeakModifier: number;
  oldScore: number;
  newScore: number;
  oldRanking: number;
  newRanking: number;
}

export interface IScoreboardMetadata {
  gameWinnerID: string | null;
  roundWinnerID: string;
  playerRoundDetails: IPlayerRoundDetails[];
  gameData: IGameMetadata;
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

    const playerRoundDetails: IPlayerRoundDetails[] = [];

    let playerScoresForThisRound: [string, number][] = [];

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
      const squeakModifier = squeakDeckCards.length; // can be either positive or negative
      const oldScore = player.totalPoints;
      const newScore = oldScore + cardsPlayed.length + squeakModifier;
      const oldRanking = player.rankInRoom;
      const newRanking = oldRanking;

      playerScoresForThisRound.push([playerID, newScore]);

      playerRoundDetails.push({
        playerID,
        cardsPlayed,
        squeakModifier,
        oldScore,
        newScore,
        oldRanking,
        newRanking,
      });
    }

    // sort playerScoresForThisRound into IPlayerRankings
    const playerRankings: IPlayerRankings = {};

    // sorts playerRoundDetails by newScore and assigns newRanking
    playerScoresForThisRound = playerScoresForThisRound.sort((a, b) => {
      return a[1] - b[1];
    });
    for (const player of playerScoresForThisRound) {
      playerRankings[player[0]] = player[1];
    }

    // sort playerRoundDetails by newScore
    const newScores: number[] = playerRoundDetails.map((player) =>
      newScores.push(player.newScore)
    );
    const descendingPlayerScores = newScores.sort((a, b) => {
      return a + b;
    });

    // assign newRanking to each playerRoundDetails
    for (const player of playerRoundDetails) {
      // offset by 1 to account for 0-indexing
      player.newRanking = descendingPlayerScores.indexOf(player.newScore) + 1;
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
    for (const player of playerRoundDetails) {
      updatePlayerStatsAfterRound({
        playerRoundDetails: player,
        roundWinnerID,
        gameWinnerID,
        playerRankingsForThisRound: playerRankings,
      });
    }

    io.in(roomCode).emit("scoreboardMetadata", {
      roundWinnerID,
      gameWinnerID,
      playerRoundDetails,
      gameData: gameData[roomCode],
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

  let cardsPlayed: ICard[] = [];

  for (const remainingCard of allCardsNotPlayedOnBoard) {
    cardsPlayed = fullDeck.filter((card) => {
      if (
        card.suit === remainingCard.suit &&
        card.value === remainingCard.value
      ) {
        return false;
      }

      return true;
    });
  }

  return cardsPlayed;
}
