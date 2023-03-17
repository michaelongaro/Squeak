import { expect, describe, it, vi } from "vitest";
import { type ICard } from "../../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../../socket";
import { deckToSqueak } from "../deckToSqueak";

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
            value: "K",
            suit: "C",
          },
          {
            value: "J",
            suit: "D",
          },
          {
            value: "Q",
            suit: "H",
          },
          {
            value: "10",
            suit: "C",
          },
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
            value: "A",
            suit: "C",
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
              value: "9",
              suit: "H",
            },
          ],
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
              value: "Q",
              suit: "H",
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
        topCardsInDeck: [
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
        ],
        nextTopCardInDeck: {
          value: "A",
          suit: "H",
        },

        totalPoints: 0,
        rankInRoom: -1,
      },
    },
    currentRound: 1,
    playerIDsThatLeftMidgame: [],
  },
};

describe("deckToSqueak", () => {
  it("should update player state if card placement is valid", () => {
    const gameData = { ...samplePlayerCardData };
    const card: ICard = { value: "8", suit: "C" };
    const squeakEndLocation = 0;
    const playerID = "player1";
    const roomCode = "room123";
    const io = {
      in: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    // @ts-expect-error io implementation is mocked
    deckToSqueak({ gameData, card, squeakEndLocation, playerID, roomCode, io });

    expect(
      gameData.room123?.players["player1"]?.squeakHand[squeakEndLocation]
    ).toEqual([
      {
        value: "9",
        suit: "H",
      },
      {
        value: "8",
        suit: "C",
      },
    ]);

    expect(gameData.room123?.players.player1?.topCardsInDeck).toEqual([
      null,
      {
        value: "A",
        suit: "S",
      },
      {
        value: "7",
        suit: "C",
      },
    ]);

    const shouldntHave = [card];
    shouldntHave.map((card) =>
      expect(gameData.room123?.players.player1?.deck).not.toContain(card)
    );

    const indexWithinSqueakStack = 1;
    const squeakStackLength = 2;

    expect(io.in).toHaveBeenCalledWith("room123");
    expect(io.emit).toHaveBeenCalledWith("cardDropApproved", {
      playerID: "player1",
      card,
      squeakEndCoords: {
        offsetHeight: indexWithinSqueakStack * (20 - squeakStackLength),
      },
      endID: `${playerID}squeakHand${squeakEndLocation}`,
      updatedBoard: gameData.room123?.board,
      updatedPlayerCards: gameData.room123?.players,
    });
  });
});
