import { type Server, type Socket } from "socket.io";
import {
  createAndFormatDeck,
  type ICard,
} from "../../../utils/generateDeckAndSqueakCards";
import { updatePlayerStatsAfterRound } from "../helpers/updatePlayerStatsAfterRound";
import { type IGameData, type IRoomData, type IMiscRoomData } from "../socket";

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

interface IRoundOverBackendVersion {
  io: Server;
  gameData: IGameData;
  roomData: IRoomData;
  miscRoomData: IMiscRoomData;
  playerWhoSqueakedID: string;
  roomCode: string;
}

export function roundOverHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData,
) {
  socket.on(
    "roundOver",
    ({
      playerWhoSqueakedID,
      roomCode,
    }: {
      playerWhoSqueakedID: string;
      roomCode: string;
    }) =>
      generateAndEmitScoreboard({
        io,
        gameData,
        roomData,
        miscRoomData,
        playerWhoSqueakedID,
        roomCode,
      }),
  );
}

export function generateAndEmitScoreboard({
  io,
  gameData,
  roomData,
  miscRoomData,
  playerWhoSqueakedID,
  roomCode,
}: IRoundOverBackendVersion) {
  const room = roomData[roomCode];
  const game = gameData[roomCode];

  const playerCards = gameData[roomCode]?.players;
  const pointsToWin = roomData[roomCode]?.roomConfig.pointsToWin;
  const players = roomData[roomCode]?.players;
  const miscRoomDataObj = miscRoomData[roomCode];

  if (
    !room ||
    !game ||
    !playerCards ||
    !pointsToWin ||
    !players ||
    !miscRoomDataObj ||
    miscRoomDataObj?.preventOtherPlayersFromSqueaking
  )
    return;

  miscRoomDataObj.preventOtherPlayersFromSqueaking = true;

  // clearing out intervals + housekeeping
  for (const botInterval of miscRoomDataObj.botIntervals) {
    clearInterval(botInterval);
  }

  miscRoomDataObj.botIntervals = [];

  for (const playerID of Object.keys(players)) {
    if (players[playerID]?.botDifficulty) {
      miscRoomDataObj.blacklistedSqueakCards[playerID] = {};
    }
  }

  const playerRoundDetails = {} as IPlayerRoundDetailsMetadata;
  const playerScoresForThisRound: [string, number][] = [];
  const playerRanksForThisRound = {} as IPlayerRankings;

  // calculate final score for each player from this round
  for (const playerID of Object.keys(playerCards)) {
    const player = playerCards[playerID];

    if (!player) return;

    // all cards in player's hand need to be counted as deck cards
    const deckCards = [...player.deck, ...player.hand];
    const squeakDeckCards = player.squeakDeck;
    const squeakHandCards = player.squeakHand.flat();

    const cardsPlayed = calculateCardsPlayedDuringRound(
      deckCards,
      squeakDeckCards,
      squeakHandCards,
    );

    const squeakModifier =
      playerWhoSqueakedID === playerID ? 10 : squeakDeckCards.length * -1;

    const roundScore = cardsPlayed.length + squeakModifier;

    if (
      playerScoresForThisRound.length === 0 ||
      roundScore > playerScoresForThisRound[0]![1]
    ) {
      playerScoresForThisRound.unshift([playerID, roundScore]);
    } else {
      playerScoresForThisRound.push([playerID, roundScore]);
    }
  }

  // calculate and store playerRoundDetails for each player
  for (const playerID of Object.keys(playerCards)) {
    const player = playerCards[playerID];

    if (!player) return;

    // all cards in player's hand need to be counted as deck cards
    const deckCards = [...player.deck, ...player.hand];
    const squeakDeckCards = player.squeakDeck;
    const squeakHandCards = player.squeakHand.flat();

    const cardsPlayed = calculateCardsPlayedDuringRound(
      deckCards,
      squeakDeckCards,
      squeakHandCards,
    );

    const squeakModifier =
      playerWhoSqueakedID === playerID ? 10 : squeakDeckCards.length * -1;
    const oldScore = player.totalPoints;
    const newScore = oldScore + cardsPlayed.length + squeakModifier;
    const oldRanking = player.rankInRoom;
    const newRanking = oldRanking; // we calculate this value farther below once playerRoundDetails is populated

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
      (playerRank) => playerRank[0] === playerID,
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

  let playerWithHighestEndScore: [string, number] | null = null;

  // find player with highest score to determine game winner
  for (const playerID of Object.keys(playerCards)) {
    const player = playerCards[playerID];

    if (!player) return;

    if (
      !playerWithHighestEndScore ||
      player.totalPoints > playerWithHighestEndScore[1]
    ) {
      playerWithHighestEndScore = [playerID, player.totalPoints];
    }
  }

  if (
    playerWithHighestEndScore &&
    playerWithHighestEndScore[1] >= pointsToWin
  ) {
    gameWinnerID = playerWithHighestEndScore[0];
  }

  const roundWinnerID = playerScoresForThisRound[0]![0]!;

  // updating stats for each user in the room
  for (const playerID of Object.keys(playerRoundDetails)) {
    if (room.players[playerID]?.botDifficulty) continue;

    updatePlayerStatsAfterRound({
      playerID,
      playerRoundDetails: playerRoundDetails[playerID]!,
      roundWinnerID,
      gameWinnerID,
      playerRankForThisRound: playerRanksForThisRound[playerID]!,
      playerScoreForThisRound: playerScoresForThisRound.find(
        (player) => player[0] === playerID,
      )![1],
    });
  }

  miscRoomDataObj.scoreboardMetadata = {
    gameWinnerID,
    roundWinnerID,
    playerRoundDetails,
  };

  io.in(roomCode).emit("scoreboardMetadata", {
    playSqueakSound: playerWhoSqueakedID !== "",
    roundWinnerID,
    gameWinnerID,
    playerRoundDetails,
  });

  return {
    roundWinnerID,
    gameWinnerID,
    playerRoundDetails,
  };
}

export function calculateCardsPlayedDuringRound(
  cardsLeftInDeck: ICard[],
  cardsLeftInSqueakDeck: ICard[],
  cardsLeftInSqueakHands: ICard[],
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
