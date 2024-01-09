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
  roundWinnerID: string;
  roomCode: string;
}

export function roundOverHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData
) {
  socket.on(
    "roundOver",
    ({
      roundWinnerID,
      roomCode,
    }: {
      roundWinnerID: string;
      roomCode: string;
    }) =>
      generateAndEmitScoreboard({
        io,
        gameData,
        roomData,
        miscRoomData,
        roundWinnerID,
        roomCode,
      })
  );
}

export function generateAndEmitScoreboard({
  io,
  gameData,
  roomData,
  miscRoomData,
  roundWinnerID,
  roomCode,
}: IRoundOverBackendVersion) {
  const room = roomData[roomCode];
  const game = gameData[roomCode];

  const playerCards = gameData[roomCode]?.players;
  const pointsToWin = roomData[roomCode]?.roomConfig.pointsToWin;
  const players = roomData[roomCode]?.players;
  // don't like this var name
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
  clearInterval(miscRoomDataObj.gameStuckInterval);

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

    const deckCards = player.deck;
    const squeakDeckCards = player.squeakDeck;
    const squeakHandCards = player.squeakHand.flat();

    const cardsPlayed = calculateCardsPlayedDuringRound(
      deckCards,
      squeakDeckCards,
      squeakHandCards
    );

    const squeakModifier =
      roundWinnerID === playerID ? 10 : squeakDeckCards.length * -1;

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
      roundWinnerID === playerID ? 10 : squeakDeckCards.length * -1;
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

  let playerWithHighestEndScore: [string, number] | null = null;

  // find player with highest score to determine game winner
  for (const playerID of Object.keys(playerCards)) {
    const player = playerCards[playerID];

    if (!player) return;

    if (!playerWithHighestEndScore) {
      playerWithHighestEndScore = [playerID, player.totalPoints];
    } else if (player.totalPoints > playerWithHighestEndScore[1]) {
      playerWithHighestEndScore = [playerID, player.totalPoints];
    }
  }

  if (
    playerWithHighestEndScore &&
    playerWithHighestEndScore[1] >= pointsToWin
  ) {
    gameWinnerID = playerWithHighestEndScore[0];
  }

  // updating stats for each user in the room
  for (const playerID of Object.keys(playerRoundDetails)) {
    updatePlayerStatsAfterRound({
      playerID,
      playerRoundDetails: playerRoundDetails[playerID]!,
      roundWinnerID,
      gameWinnerID,
      playerRankForThisRound: playerRanksForThisRound[playerID]!,
      playerScoreForThisRound: playerScoresForThisRound.find(
        (player) => player[0] === playerID
      )![1],
    });
  }

  // pick the first present human player to start the next round
  const playerIDsPresentlyInRoom = Object.keys(room.players).filter(
    (playerID) =>
      !game?.playerIDsThatLeftMidgame.includes(playerID) &&
      !room.players[playerID]?.botDifficulty
  );

  io.in(roomCode).emit("scoreboardMetadata", {
    roundWinnerID,
    gameWinnerID,
    playerRoundDetails,
    playerIDToStartNextRound: playerIDsPresentlyInRoom[0],
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
