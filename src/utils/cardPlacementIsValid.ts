import { type ICard } from "./generateDeckAndSqueakCards";

const valueToNumberMap = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};

const suitToNumberMap = {
  H: 1,
  C: 2,
  D: 3,
  S: 4,
};

type validCardValues =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";
type validCardSuits = "H" | "C" | "D" | "S";

function cardPlacementIsValid(
  currentCell: ICard | null,
  value: string,
  suit: string,
  forBoard: boolean
): boolean {
  const proposedNumValue = valueToNumberMap[value as validCardValues];
  const baseNumValue = currentCell
    ? valueToNumberMap[currentCell.value as validCardValues]
    : null;

  const proposedNumSuit = currentCell
    ? suitToNumberMap[currentCell.suit as validCardSuits]
    : null;

  const baseNumSuit = suitToNumberMap[suit as validCardSuits];

  // "K" is the last card that can be placed onto a deck (necessary?)
  if (forBoard && currentCell?.value !== "K") {
    // cell is empty + card is an ace
    if (baseNumValue === null && proposedNumValue === 1) return true;

    if (baseNumValue && proposedNumSuit) {
      if (
        proposedNumValue === baseNumValue + 1 &&
        proposedNumSuit === baseNumSuit
      )
        return true;
    }
  } else if (!forBoard && baseNumValue) {
    if (
      proposedNumSuit &&
      // value of card being added is one less than the current card
      proposedNumValue === baseNumValue - 1 &&
      // checking for opposite color
      baseNumSuit % 2 !== proposedNumSuit % 2
    )
      return true;
  }

  return false;
}

export default cardPlacementIsValid;
