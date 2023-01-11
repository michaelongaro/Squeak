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
  hearts: 1,
  clubs: 2,
  diamonds: 3,
  spades: 4,
};

function cardPlacementIsValid(
  currentCell: ICard | null,
  value: string,
  suit: string,
  forBoard: boolean
): boolean {
  console.log(currentCell);

  // @ts-expect-error asdf
  const numValueOfCardBeingPlaced = valueToNumberMap[value];
  const numValueOfCurrentCell = currentCell
    ? // @ts-expect-error asdf
      valueToNumberMap[currentCell.value]
    : null;

  // "K" is the last card that can be placed onto a deck
  if (forBoard && currentCell?.value !== "K") {
    // cell is empty + card is an ace
    if (currentCell === null && numValueOfCardBeingPlaced === 1) return true;

    if (currentCell?.value) {
      if (
        numValueOfCardBeingPlaced === numValueOfCurrentCell + 1 &&
        suit === currentCell.suit
      )
        return true;
    }
  } else {
    // // @ts-expect-error asdf
    // const numValue = valueToNumberMap[value];

    // @ts-expect-error asdf
    const numSuitBeingPlaced = suitToNumberMap[suit];
    // @ts-expect-error asdf
    const baseNumSuit = suitToNumberMap[suit];

    if (
      // value of card being added is one less than the current card
      numValueOfCardBeingPlaced === numValueOfCurrentCell - 1 &&
      // checking for opposite color
      baseNumSuit % 2 !== numSuitBeingPlaced % 2
    )
      return true;
  }

  return false;
}

export default cardPlacementIsValid;
