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

function cardPlacementIsValid(
  currentCell: ICard | null,
  value: string,
  suit: string
): boolean {
  // @ts-expect-error asdf
  const numValue = valueToNumberMap[value];

  // cell is empty + card is an ace
  if (currentCell === null && numValue === 1) return true;

  if (currentCell?.value) {
    if (
      numValue === parseInt(currentCell.value) + 1 &&
      suit == currentCell.suit
    )
      return true;
  }

  return false;
}

export default cardPlacementIsValid;
