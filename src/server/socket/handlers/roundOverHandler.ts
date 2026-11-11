import type { PlayerSocket as Socket } from "~/types/socket";
import { type Server } from "socket.io";
import { calculateCardsPlayedDuringRound } from "~/utils/calculateCardsPlayedDuringRound";
import { updatePlayerStatsAfterRound } from "../helpers/updatePlayerStatsAfterRound";
import { recordAnalytics } from "~/server/analytics";
import type {
  IGameData,
  IMiscRoomData,
  IPlayerRankings,
  IPlayerRoundDetailsMetadata,
  IRoomData,
} from "~/types/socket";

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
    }) => {
      if (
        !playerWhoSqueakedID ||
        socket.data.playerID !== playerWhoSqueakedID ||
        !socket.rooms.has(roomCode)
      )
        return;
      generateAndEmitScoreboard({
        io,
        gameData,
        roomData,
        miscRoomData,
        playerWhoSqueakedID,
        roomCode,
      });
    },
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

  // The Squeak button is exposed only after the player's squeak deck is empty.
  if (
    playerWhoSqueakedID !== "" &&
    game.players[playerWhoSqueakedID]?.squeakDeck.length !== 0
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

  newPlayerRanks.sort((a, b) => b[1] - a[1]);
  playerScoresForThisRound.sort((a, b) => b[1] - a[1]);

  // adding sorted ranks for this round + overall new ranks to playerRoundDetails
  for (const playerID of Object.keys(playerCards)) {
    const player = playerCards[playerID];

    if (!player || !playerRoundDetails) return;

    playerRoundDetails[playerID]!.newRanking =
      newPlayerRanks.findIndex((playerRank) => playerRank[0] === playerID) + 1;

    playerRanksForThisRound[playerID] =
      playerScoresForThisRound.findIndex(
        (playerRank) => playerRank[0] === playerID,
      ) + 1;
  }

  // updating players in gameData with their new values
  for (const playerID of Object.keys(playerCards)) {
    const player = playerCards[playerID];

    if (!player || !playerRoundDetails) return;

    player.totalPoints = playerRoundDetails[playerID]!.newScore;
    player.rankInRoom = playerRoundDetails[playerID]!.newRanking;
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

    void updatePlayerStatsAfterRound({
      playerID,
      playerRoundDetails: playerRoundDetails[playerID]!,
      playerWhoSqueakedID,
      gameWinnerID,
      playerRankForThisRound: playerRanksForThisRound[playerID]!,
      playerScoreForThisRound: playerScoresForThisRound.find(
        (player) => player[0] === playerID,
      )![1],
    }).catch((error: unknown) =>
      console.error("Failed to update player stats:", error),
    );
  }

  miscRoomDataObj.scoreboardMetadata = {
    gameWinnerID,
    roundWinnerID,
    playerRoundDetails,
  };

  void recordAnalytics({ roundsPlayed: 1, gamesPlayed: gameWinnerID ? 1 : 0 });

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
