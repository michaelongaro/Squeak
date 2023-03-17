import { expect, describe, it, vi } from "vitest";
import { type IGameData } from "../../socket";
import { drawFromDeck } from "../drawFromDeckHandler";

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
            value: "3",
            suit: "S",
          },
          {
            value: "2",
            suit: "H",
          },
          {
            value: "5",
            suit: "D",
          },
          {
            value: "9",
            suit: "H",
          },

          {
            value: "J",
            suit: "H",
          },
          {
            value: "8",
            suit: "S",
          },
          {
            value: "4",
            suit: "C",
          },
          {
            value: "J",
            suit: "S",
          },
        ],
        squeakHand: [
          [
            {
              value: "K",
              suit: "C",
            },
          ],
          [
            {
              value: "J",
              suit: "D",
            },
          ],
          [
            {
              value: "10",
              suit: "C",
            },
          ],
          [
            {
              value: "A",
              suit: "C",
            },
          ],
        ],
        deck: [
          {
            value: "K",
            suit: "S",
          },
          {
            value: "5",
            suit: "S",
          },
          {
            value: "Q",
            suit: "C",
          },
          {
            value: "7",
            suit: "H",
          },
          {
            value: "10",
            suit: "H",
          },
          {
            value: "K",
            suit: "D",
          },
          {
            value: "4",
            suit: "S",
          },
          {
            value: "6",
            suit: "C",
          },
          {
            value: "J",
            suit: "C",
          },
          {
            value: "3",
            suit: "D",
          },
          {
            value: "5",
            suit: "C",
          },
          {
            value: "10",
            suit: "D",
          },
          {
            value: "8",
            suit: "H",
          },
          {
            value: "A",
            suit: "S",
          },
          {
            value: "7",
            suit: "C",
          },
          {
            value: "8",
            suit: "C",
          },
          {
            value: "5",
            suit: "H",
          },
          {
            value: "9",
            suit: "D",
          },
          {
            value: "A",
            suit: "H",
          },
          {
            value: "3",
            suit: "H",
          },
          {
            value: "8",
            suit: "D",
          },
          {
            value: "2",
            suit: "S",
          },
          {
            value: "7",
            suit: "D",
          },
          {
            value: "4",
            suit: "H",
          },
          {
            value: "6",
            suit: "H",
          },
          {
            value: "7",
            suit: "S",
          },
          {
            value: "K",
            suit: "H",
          },
          {
            value: "6",
            suit: "S",
          },
          {
            value: "A",
            suit: "D",
          },
          {
            value: "3",
            suit: "C",
          },
          {
            value: "2",
            suit: "D",
          },
          {
            value: "Q",
            suit: "S",
          },
          {
            value: "6",
            suit: "D",
          },
          {
            value: "10",
            suit: "S",
          },
          {
            value: "Q",
            suit: "D",
          },
          {
            value: "4",
            suit: "D",
          },
          {
            value: "9",
            suit: "C",
          },
          {
            value: "2",
            suit: "C",
          },
          {
            value: "9",
            suit: "S",
          },
        ],
        deckIdx: -1,
        topCardsInDeck: [null, null, null],
        nextTopCardInDeck: {
          value: "Q",
          suit: "C",
        },
        totalPoints: 0,
        rankInRoom: -1,
      },
    },
    currentRound: 1,
    playerIDsThatLeftMidgame: [],
  },
};

describe("drawFromDeckHandler", () => {
  it("should update player state with newly drawn cards if deckIdx is within standard bounds", () => {
    const gameData = { ...samplePlayerCardData };
    const playerID = "player1";
    const roomCode = "room123";
    const nextTopCardInDeck = {
      value: "K",
      suit: "D",
    };
    const io = {
      in: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    drawFromDeck({
      // @ts-expect-error io implementation is mocked
      io,
      gameData,
      playerID,
      roomCode,
    });

    expect(gameData.room123?.players.player1?.deck).toEqual(
      gameData.room123?.players.player1?.deck
    );

    expect(gameData.room123?.players.player1?.topCardsInDeck).toEqual([
      {
        value: "K",
        suit: "S",
      },
      {
        value: "5",
        suit: "S",
      },
      {
        value: "Q",
        suit: "C",
      },
    ]);

    expect(gameData.room123?.players.player1?.deckIdx).toEqual(2);

    expect(gameData.room123?.players.player1?.nextTopCardInDeck).toEqual(
      nextTopCardInDeck
    );

    expect(io.in).toHaveBeenCalledWith("room123");
    expect(io.emit).toHaveBeenCalledWith("playerDrawnFromDeck", {
      playerID: "player1",
      nextTopCardInDeck: {
        value: "Q",
        suit: "C",
      },
      updatedBoard: gameData.room123?.board,
      updatedPlayerCards: gameData.room123?.players,
    });
  });

  // TODO: tests for when drawing last set of cards in deck and when resetting deck
});
