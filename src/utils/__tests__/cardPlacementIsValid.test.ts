import { expect, describe, it } from "vitest";
import cardPlacementIsValid from "../cardPlacementIsValid";
import { type ICard } from "../generateDeckAndSqueakCards";

describe("cardPlacementIsValid", () => {
  const emptyCell: ICard | null = null;
  const nonEmptyCell: ICard = { value: "J", suit: "H" };
  const kingCell: ICard = { value: "K", suit: "H" };

  describe("when placing a card onto the board", () => {
    it("should allow an ace to be placed on an empty cell", () => {
      expect(cardPlacementIsValid(emptyCell, "A", "C", true)).toBe(true);
    });

    it("should allow a card of the same suit and one higher value to be placed on a non-empty cell", () => {
      expect(cardPlacementIsValid(nonEmptyCell, "Q", "H", true)).toBe(true);
    });

    it("should not allow a card of the same suit and a lower value to be placed on a non-empty cell", () => {
      expect(cardPlacementIsValid(nonEmptyCell, "10", "H", true)).toBe(false);
    });

    it("should not allow a card of a different suit to be placed on a non-empty cell", () => {
      expect(cardPlacementIsValid(nonEmptyCell, "K", "S", true)).toBe(false);
    });

    it("should not allow a card higher than a king to be placed on the board", () => {
      expect(cardPlacementIsValid(kingCell, "A", "H", true)).toBe(false);
    });
  });

  describe("when placing a card onto a cell", () => {
    it("should allow a card of opposite color and one lower value to be placed on a non-empty cell", () => {
      expect(cardPlacementIsValid(nonEmptyCell, "10", "S", false)).toBe(true);
    });

    it("should not allow a card of the same color to be placed on a non-empty cell", () => {
      expect(cardPlacementIsValid(nonEmptyCell, "K", "D", false)).toBe(false);
    });

    it("should not allow a card of the same value to be placed on a non-empty cell", () => {
      expect(cardPlacementIsValid(nonEmptyCell, "J", "S", false)).toBe(false);
    });

    it("should not allow a card to be placed on an empty cell", () => {
      expect(cardPlacementIsValid(emptyCell, "A", "S", false)).toBe(false);
    });
  });
});
