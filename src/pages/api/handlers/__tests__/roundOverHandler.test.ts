import { expect, describe, it, vi } from "vitest";
import { type IRoomData, type IGameData } from "../../socket";
import { generateAndEmitScoreboard } from "../roundOverHandler";

// fyi, I copied this from the other test file, and haven't perfectly changed
// the deck data, however the implementation should result in the same output.

const samplePlayerCardData: IGameData = {
  room123: {
    board: [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ],
    players: {
      player1: {
        squeakDeck: [
          {
            value: "10",
            suit: "C",
          },
          {
            value: "8",
            suit: "C",
          },
          {
            value: "4",
            suit: "D",
          },
          {
            value: "K",
            suit: "D",
          },
          {
            value: "A",
            suit: "C",
          },
          {
            value: "3",
            suit: "H",
          },
        ],
        squeakHand: [
          [
            {
              value: "10",
              suit: "H",
            },
          ],
          [
            {
              value: "Q",
              suit: "C",
            },
          ],
          [
            {
              value: "J",
              suit: "H",
            },
          ],
          [
            {
              value: "A",
              suit: "H",
            },
          ],
        ],
        deck: [
          {
            value: "2",
            suit: "S",
          },
          {
            value: "2",
            suit: "C",
          },
          {
            value: "6",
            suit: "H",
          },
          {
            value: "8",
            suit: "D",
          },
          {
            value: "Q",
            suit: "S",
          },
          {
            value: "3",
            suit: "D",
          },
          {
            value: "K",
            suit: "C",
          },
          {
            value: "2",
            suit: "D",
          },
          {
            value: "3",
            suit: "S",
          },
          {
            value: "Q",
            suit: "H",
          },
          {
            value: "A",
            suit: "D",
          },
          {
            value: "7",
            suit: "S",
          },
          {
            value: "5",
            suit: "H",
          },
          {
            value: "9",
            suit: "H",
          },
          {
            value: "8",
            suit: "H",
          },
          {
            value: "3",
            suit: "C",
          },
          {
            value: "Q",
            suit: "D",
          },
          {
            value: "J",
            suit: "S",
          },
          {
            value: "A",
            suit: "S",
          },
          {
            value: "J",
            suit: "C",
          },
          {
            value: "4",
            suit: "S",
          },
          {
            value: "K",
            suit: "S",
          },
          {
            value: "6",
            suit: "C",
          },
          {
            value: "6",
            suit: "D",
          },
          {
            value: "10",
            suit: "D",
          },
          {
            value: "5",
            suit: "C",
          },
        ],
        deckIdx: -1,
        topCardsInDeck: [null, null, null],
        nextTopCardInDeck: {
          value: "6",
          suit: "H",
        },
        totalPoints: 0,
        rankInRoom: -1,
      },
      player2: {
        squeakDeck: [],
        squeakHand: [
          [
            {
              value: "8",
              suit: "H",
            },
          ],
          [
            {
              value: "4",
              suit: "S",
            },
          ],
          [
            {
              value: "2",
              suit: "S",
            },
          ],
          [
            {
              value: "6",
              suit: "D",
            },
          ],
        ],
        deck: [
          {
            value: "Q",
            suit: "H",
          },
          {
            value: "J",
            suit: "H",
          },
          {
            value: "7",
            suit: "D",
          },
          {
            value: "J",
            suit: "S",
          },
          {
            value: "A",
            suit: "D",
          },
          {
            value: "9",
            suit: "D",
          },
          {
            value: "8",
            suit: "S",
          },
          {
            value: "9",
            suit: "S",
          },
          {
            value: "8",
            suit: "D",
          },
          {
            value: "5",
            suit: "D",
          },
          {
            value: "2",
            suit: "C",
          },
          {
            value: "10",
            suit: "D",
          },
          {
            value: "7",
            suit: "C",
          },
          {
            value: "2",
            suit: "D",
          },
          {
            value: "7",
            suit: "H",
          },
          {
            value: "Q",
            suit: "S",
          },
          {
            value: "3",
            suit: "D",
          },
          {
            value: "5",
            suit: "C",
          },
        ],
        deckIdx: -1,
        topCardsInDeck: [null, null, null],
        nextTopCardInDeck: {
          value: "7",
          suit: "D",
        },
        totalPoints: 0,
        rankInRoom: -1,
      },
    },
    currentRound: 1,
    playerIDsThatLeftMidgame: [],
  },
};

const sampleRoomData: IRoomData = {
  room123: {
    roomConfig: {
      pointsToWin: 100,
      maxPlayers: 2,
      playersInRoom: 2,
      isPublic: true,
      code: "abc123",
      hostUsername: "hostUsername",
      hostUserID: "1",
      gameStarted: true,
    },
    players: {
      player1: {
        username: "hostUsername",
        avatarPath: "foo",
        color: "bar",
        deckHueRotation: 0,
      },
      player2: {
        username: "joinerUsername",
        avatarPath: "foo",
        color: "bar",
        deckHueRotation: 0,
      },
    },
  },
};

describe("roundOverHandler", () => {
  it("should calculate each player's scores correctly based on their actions during the round", () => {
    const gameData = { ...samplePlayerCardData };
    const roomData = { ...sampleRoomData };
    const roomCode = "room123";
    const io = {
      in: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    // player1 moved 3 cards from their squeak pile, and 13 cards from their deck
    // player2 squeaked (moved all 9 cards from their squeak pile), and 21 cards from their deck

    const returnedScoreboard = generateAndEmitScoreboard({
      // @ts-expect-error io implementation is mocked
      io,
      gameData,
      roomData,
      roundWinnerID: "player2",
      roomCode,
    });

    // using hack to calculate whether the cards played are valid
    // calculating equality of both player's cards played
    const firstPlayerCardsPlayed = returnedScoreboard?.playerRoundDetails[
      "player1"
    ]?.cardsPlayed
      .map((card) => {
        return Object.values(card);
      })
      .sort();

    const actualFirstPlayerCardsPlayed = [
      {
        value: "5",
        suit: "S",
      },
      {
        value: "7",
        suit: "D",
      },
      {
        value: "6",
        suit: "S",
      },
      {
        value: "4",
        suit: "H",
      },
      {
        value: "J",
        suit: "D",
      },
      {
        value: "4",
        suit: "C",
      },
      {
        value: "5",
        suit: "D",
      },
      {
        value: "8",
        suit: "S",
      },
      {
        value: "9",
        suit: "D",
      },
      {
        value: "9",
        suit: "S",
      },
      {
        value: "2",
        suit: "H",
      },
      {
        value: "9",
        suit: "C",
      },
      {
        value: "7",
        suit: "H",
      },
      {
        value: "K",
        suit: "H",
      },
      {
        value: "10",
        suit: "S",
      },
      {
        value: "7",
        suit: "C",
      },
    ]

      .map((card) => {
        return Object.values(card);
      })
      .sort();

    const secondPlayerCardsPlayed = returnedScoreboard?.playerRoundDetails[
      "player2"
    ]?.cardsPlayed
      .map((card) => {
        return Object.values(card);
      })
      .sort();

    const actualSecondPlayerCardsPlayed = [
      {
        value: "A",
        suit: "S",
      },
      {
        value: "J",
        suit: "C",
      },
      {
        value: "2",
        suit: "H",
      },
      {
        value: "9",
        suit: "H",
      },
      {
        value: "6",
        suit: "C",
      },
      {
        value: "3",
        suit: "C",
      },
      {
        value: "9",
        suit: "C",
      },
      {
        value: "4",
        suit: "H",
      },
      {
        value: "A",
        suit: "H",
      },
      {
        value: "3",
        suit: "S",
      },
      {
        value: "K",
        suit: "C",
      },
      {
        value: "6",
        suit: "S",
      },
      {
        value: "5",
        suit: "H",
      },
      {
        value: "Q",
        suit: "D",
      },
      {
        value: "10",
        suit: "H",
      },
      {
        value: "8",
        suit: "C",
      },
      {
        value: "K",
        suit: "H",
      },
      {
        value: "6",
        suit: "H",
      },
      {
        value: "A",
        suit: "C",
      },
      {
        value: "4",
        suit: "C",
      },
      {
        value: "J",
        suit: "D",
      },
      {
        value: "Q",
        suit: "C",
      },
      {
        value: "7",
        suit: "S",
      },
      {
        value: "10",
        suit: "C",
      },
      {
        value: "5",
        suit: "S",
      },
      {
        value: "K",
        suit: "D",
      },
      {
        value: "3",
        suit: "H",
      },
      {
        value: "4",
        suit: "D",
      },
      {
        value: "K",
        suit: "S",
      },
      {
        value: "10",
        suit: "S",
      },
    ]
      .map((card) => {
        return Object.values(card);
      })
      .sort();

    expect(firstPlayerCardsPlayed).toEqual(actualFirstPlayerCardsPlayed);
    expect(secondPlayerCardsPlayed).toEqual(actualSecondPlayerCardsPlayed);

    // checking whether the other playerRoundDetails are correct
    const justTheOtherPlayerRoundDetails = {
      ...returnedScoreboard?.playerRoundDetails,
    };

    const comparableObjectForEquality = {
      roundWinnerID: returnedScoreboard?.roundWinnerID,
      gameWinnerID: returnedScoreboard?.gameWinnerID,
      playerRoundDetails: {
        ...justTheOtherPlayerRoundDetails,
        player1: {
          ...justTheOtherPlayerRoundDetails["player1"],
          cardsPlayed: actualFirstPlayerCardsPlayed,
        },
        player2: {
          ...justTheOtherPlayerRoundDetails["player2"],
          cardsPlayed: actualSecondPlayerCardsPlayed,
        },
      },
    };

    expect(comparableObjectForEquality).toEqual({
      roundWinnerID: "player2",
      gameWinnerID: null,
      playerRoundDetails: {
        player1: {
          playerID: "player1",
          cardsPlayed: actualFirstPlayerCardsPlayed,
          squeakModifier: -6,
          oldScore: 0,
          newScore: 10,
          oldRanking: -1,
          newRanking: 2,
        },
        player2: {
          playerID: "player2",
          cardsPlayed: actualSecondPlayerCardsPlayed,
          squeakModifier: 10,
          oldScore: 0,
          newScore: 40,
          oldRanking: -1,
          newRanking: 1,
        },
      },
    });

    // expect(io.in).toHaveBeenCalledWith("room123");
    // expect(io.emit).toHaveBeenCalledWith("scoreboardMetadata", {
    //   roundWinnerID: "joinerUsername",
    //   gameWinnerID: null,
    //   playerRoundDetails: {
    //     player1: {
    //       playerID: "player1",
    //       cardsPlayed: ,
    //       squeakModifier: -6,
    //       oldScore: 0,
    //       newScore: 10,
    //       oldRanking: -1,
    //       newRanking: 2,
    //     },
    //     player2: {
    //       playerID: "player2",
    //       cardsPlayed: ,
    //       squeakModifier: 10,
    //       oldScore: 0,
    //       newScore: 31,
    //       oldRanking: -1,
    //       newRanking: 1,
    //     },
    //   },
    // });
  });
});
