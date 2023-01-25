import { type Server, type Socket } from "socket.io";
import {
  createAndFormatDeck,
  type ICard,
} from "../../../utils/generateDeckAndSqueakCards";
import {
  type IGameData,
  type IDrawFromDeck,
  type IPlayerCardsMetadata,
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
  winnerID: string;
  playerRoundDetails: IPlayerRoundDetails[];
  updatedBoard: (ICard | null)[][];
  updatedPlayerCards: IPlayerCardsMetadata;
}

export function roundOverHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData
) {
  function generateAndEmitScoreboard({ playerID, roomCode }: IDrawFromDeck) {
    const playerCards = gameData[roomCode]?.players;

    if (!playerCards) return;

    const playerRoundDetails: IPlayerRoundDetails[] = [];

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

    io.in(roomCode).emit("scoreboardMetadata", {
      winnerID: playerID,
      playerRoundDetails,
      updatedBoard: gameData[roomCode]?.board,
      updatedPlayerCards: gameData[roomCode]?.players,
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
