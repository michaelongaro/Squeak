import { expect, describe, it } from "vitest";
import generateDeckAndSqueakCards, {
  type IPlayerCards,
} from "../generateDeckAndSqueakCards";

describe("generateDeckAndSqueakCards", () => {
  it("returns a valid object with expected properties", () => {
    const playerCards: IPlayerCards = generateDeckAndSqueakCards();

    // check if all the properties are defined
    expect(playerCards).toBeDefined();
    expect(playerCards.squeakDeck).toBeDefined();
    expect(playerCards.squeakHand).toBeDefined();
    expect(playerCards.deck).toBeDefined();
    expect(playerCards.deckIdx).toBeDefined();
    expect(playerCards.topCardsInDeck).toBeDefined();
    expect(playerCards.nextTopCardInDeck).toBeDefined();

    // check if squeak deck contains exactly 13 cards
    expect(playerCards.squeakDeck.length).toBe(13);

    // check if squeak hand contains exactly 4 empty arrays
    expect(playerCards.squeakHand.length).toBe(4);
    expect(
      playerCards.squeakHand.every(
        (hand) => Array.isArray(hand) && hand.length === 0
      )
    ).toBe(true);

    // check if deck contains 52 cards after removing squeak deck
    expect(playerCards.deck.length).toBe(52 - 13);

    // check if deck is shuffled
    expect(playerCards.deck).not.toEqual(generateDeckAndSqueakCards().deck);

    // check if deck index is -1
    expect(playerCards.deckIdx).toBe(-1);

    // check if top cards in deck contains exactly 3 null values
    expect(playerCards.topCardsInDeck.length).toBe(3);
    expect(playerCards.topCardsInDeck.every((card) => card === null)).toBe(
      true
    );

    // check if next top card in deck is valid
    expect(playerCards.nextTopCardInDeck).toBeDefined();
  });
});
