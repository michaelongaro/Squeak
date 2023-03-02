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
  gameData: IGameMetadata;
}

export interface IPlayerRoundDetailsMetadata {
  [playerID: string]: IPlayerRoundDetails;
}

export interface IPlayerRoundDetails {
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

    const playerScoresForThisRound: IPlayerRankings = {};

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

      playerScoresForThisRound[playerID] = cardsPlayed.length + squeakModifier;
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

      if (!player || !playerRoundDetails || !playerScoresForThisRound) return;

      newPlayerRanks.push([
        playerID,
        playerRoundDetails[playerID]!.oldScore +
          playerScoresForThisRound[playerID]!,
      ]);
    }

    // updating playerRoundDetails with new rankings
    for (const playerID of Object.keys(playerCards)) {
      const player = playerCards[playerID];

      if (!player || !playerRoundDetails) return;

      playerRoundDetails[playerID]!.newRanking =
        newPlayerRanks
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
      // convert obj to array for easier sorting
      const playerScoresForThisRoundArray: [string, number][] = [];
      for (const [key, value] of Object.entries(playerScoresForThisRound)) {
        playerScoresForThisRoundArray.push([key, value]);
      }

      updatePlayerStatsAfterRound({
        playerID,
        playerRoundDetails: playerRoundDetails[playerID]!,
        roundWinnerID,
        gameWinnerID,
        playerRankForThisRound:
          playerScoresForThisRoundArray
            .sort((a, b) => b[1] - a[1])
            .findIndex((playerRank) => playerRank[0] === playerID) + 1,
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

  for (const cardToBeFiltered of allCardsNotPlayedOnBoard) {
    cardsPlayed = fullDeck.filter((card) => {
      if (
        card.suit === cardToBeFiltered.suit &&
        card.value === cardToBeFiltered.value
      ) {
        return false;
      }

      return true;
    });
  }

  return cardsPlayed;
}
