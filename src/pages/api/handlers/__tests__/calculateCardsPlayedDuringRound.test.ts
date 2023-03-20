import { expect, describe, it } from "vitest";
import { calculateCardsPlayedDuringRound } from "../roundOverHandler";

// fyi, I copied this from the other test file, and haven't perfectly changed
// the deck data, however the implementation should result in the same output.

const fullDeck = {
  squeakDeck: [
    {
      value: "9",
      suit: "H",
    },
    {
      value: "4",
      suit: "H",
    },
    {
      value: "3",
      suit: "D",
    },
    {
      value: "5",
      suit: "S",
    },
    {
      value: "6",
      suit: "S",
    },
    {
      value: "A",
      suit: "S",
    },
    {
      value: "10",
      suit: "C",
    },
    {
      value: "K",
      suit: "C",
    },
    {
      value: "8",
      suit: "D",
    },
    {
      value: "A",
      suit: "D",
    },
    {
      value: "10",
      suit: "S",
    },
    {
      value: "9",
      suit: "C",
    },
    {
      value: "9",
      suit: "D",
    },
  ],
  squeakHand: [[], [], [], []],
  deck: [
    {
      value: "2",
      suit: "D",
    },
    {
      value: "7",
      suit: "S",
    },
    {
      value: "2",
      suit: "S",
    },
    {
      value: "8",
      suit: "C",
    },
    {
      value: "4",
      suit: "C",
    },
    {
      value: "3",
      suit: "S",
    },
    {
      value: "5",
      suit: "D",
    },
    {
      value: "5",
      suit: "H",
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
      value: "J",
      suit: "H",
    },
    {
      value: "A",
      suit: "H",
    },
    {
      value: "2",
      suit: "C",
    },
    {
      value: "5",
      suit: "C",
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
      value: "6",
      suit: "H",
    },
    {
      value: "10",
      suit: "H",
    },
    {
      value: "J",
      suit: "C",
    },
    {
      value: "J",
      suit: "S",
    },
    {
      value: "4",
      suit: "S",
    },
    {
      value: "7",
      suit: "C",
    },
    {
      value: "Q",
      suit: "D",
    },
    {
      value: "Q",
      suit: "C",
    },
    {
      value: "7",
      suit: "D",
    },
    {
      value: "J",
      suit: "D",
    },
    {
      value: "8",
      suit: "S",
    },
    {
      value: "Q",
      suit: "H",
    },
    {
      value: "K",
      suit: "D",
    },
    {
      value: "6",
      suit: "D",
    },
    {
      value: "2",
      suit: "H",
    },
    {
      value: "6",
      suit: "C",
    },
    {
      value: "K",
      suit: "H",
    },
    {
      value: "Q",
      suit: "S",
    },
    {
      value: "K",
      suit: "S",
    },
    {
      value: "9",
      suit: "S",
    },
    {
      value: "7",
      suit: "H",
    },
    {
      value: "3",
      suit: "C",
    },
    {
      value: "A",
      suit: "C",
    },
  ],
};

const deckWithTwoCardsThatWerePlayed = {
  squeakDeck: [
    {
      value: "3",
      suit: "S",
    },
    {
      value: "4",
      suit: "H",
    },
    {
      value: "4",
      suit: "S",
    },
    {
      value: "A",
      suit: "S",
    },
  ],
  squeakHand: [
    [
      {
        value: "2",
        suit: "S",
      },
    ],
    [
      {
        value: "6",
        suit: "C",
      },
    ],
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
  ],
  deck: [
    {
      value: "6",
      suit: "H",
    },
    {
      value: "K",
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
      value: "3",
      suit: "D",
    },
    {
      value: "K",
      suit: "S",
    },
    {
      value: "6",
      suit: "D",
    },
    {
      value: "A",
      suit: "D",
    },
    {
      value: "10",
      suit: "D",
    },
    {
      value: "5",
      suit: "H",
    },
    {
      value: "K",
      suit: "C",
    },
    {
      value: "J",
      suit: "D",
    },
    {
      value: "7",
      suit: "C",
    },
    {
      value: "Q",
      suit: "S",
    },
    {
      value: "9",
      suit: "C",
    },
    {
      value: "Q",
      suit: "D",
    },
    {
      value: "7",
      suit: "S",
    },
    {
      value: "5",
      suit: "S",
    },
    {
      value: "6",
      suit: "S",
    },
    {
      value: "4",
      suit: "C",
    },
    {
      value: "9",
      suit: "H",
    },
    {
      value: "8",
      suit: "C",
    },
    {
      value: "5",
      suit: "D",
    },
    {
      value: "5",
      suit: "C",
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
      value: "3",
      suit: "C",
    },
    {
      value: "8",
      suit: "S",
    },
    {
      value: "J",
      suit: "S",
    },
    {
      value: "3",
      suit: "H",
    },
    {
      value: "K",
      suit: "D",
    },
    {
      value: "10",
      suit: "S",
    },
    {
      value: "Q",
      suit: "H",
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
      value: "8",
      suit: "H",
    },
    {
      value: "A",
      suit: "C",
    },
    {
      value: "A",
      suit: "H",
    },
    {
      value: "10",
      suit: "C",
    },
    {
      value: "2",
      suit: "C",
    },
    {
      value: "4",
      suit: "D",
    },
    {
      value: "2",
      suit: "D",
    },
  ],
  deckIdx: -1,
  topCardsInDeck: [null, null, null],
  nextTopCardInDeck: {
    value: "Q",
    suit: "D",
  },
};

describe("calculateCardsPlayedDuringRound", () => {
  it("should return an empty array if no cards were played", () => {
    const cardsPlayed = calculateCardsPlayedDuringRound(
      fullDeck.deck,
      fullDeck.squeakDeck,
      fullDeck.squeakHand.flat()
    );

    expect(cardsPlayed.length).toEqual(0);
  });

  it("should return the correct cards that were played", () => {
    const cardsPlayed = calculateCardsPlayedDuringRound(
      deckWithTwoCardsThatWerePlayed.deck,
      deckWithTwoCardsThatWerePlayed.squeakDeck,
      deckWithTwoCardsThatWerePlayed.squeakHand.flat()
    );

    // workaround to test equality of card arrays
    const formattedCardsPlayed = cardsPlayed
      .map((card) => {
        return Object.values(card);
      })
      .sort();

    const actualCardsPlayed = [
      {
        value: "9",
        suit: "D",
      },
      {
        value: "7",
        suit: "H",
      },
    ];

    const formattedActualCardsPlayed = actualCardsPlayed
      .map((card) => {
        return Object.values(card);
      })
      .sort();

    expect(formattedCardsPlayed).toEqual(formattedActualCardsPlayed);
  });
});
