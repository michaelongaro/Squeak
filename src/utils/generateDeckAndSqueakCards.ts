export interface ICard {
  value: string;
  suit: string;
}

export interface IPlayerCards {
  squeakPile: ICard[];
  squeakRow: ICard[];
  deck: ICard[];
}

const suits = ["C", "S", "H", "D"];
const values = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function createAndFormatDeck(): ICard[] {
  const deck: ICard[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 13; j++) {
      deck.push({
        value: values[j]!, // not sure how to avoid using "!" here
        suit: suits[i]!,
      });
    }
  }

  return shuffleDeck(deck);
}

// create a function that shuffles the deck
function shuffleDeck(deck: ICard[]): ICard[] {
  const shuffledDeck: ICard[] = [];

  while (deck.length > 0) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    if (deck[randomIndex] === undefined) continue;
    const card: ICard = deck[randomIndex]!; // not sure how to avoid using "!" here
    shuffledDeck.push(card);
    deck.splice(randomIndex, 1);
  }

  return shuffledDeck;
}

function generateDeckAndSqueakCards(): IPlayerCards {
  const deck = createAndFormatDeck();
  const squeakPile = deck.splice(0, 13);
  const squeakRow = squeakPile.splice(0, 4);

  return {
    squeakPile,
    squeakRow,
    deck,
  };
}

export default generateDeckAndSqueakCards;
