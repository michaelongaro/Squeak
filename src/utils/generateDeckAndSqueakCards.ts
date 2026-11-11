export interface ICard {
  value: string;
  suit: string;
}

export interface IPlayerCards {
  squeakDeck: ICard[];
  squeakHand: ICard[][];
  deck: ICard[];
  hand: ICard[];
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

export function createDeck(): ICard[] {
  const deck: ICard[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 13; j++) {
      deck.push({
        value: values[j] as string,
        suit: suits[i] as string,
      });
    }
  }

  return deck;
}

export function createAndFormatDeck(): ICard[] {
  const deck = createDeck();
  // Fisher-Yates shuffles in linear time without repeatedly splicing the deck.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck;
}

function generateDeckAndSqueakCards(): IPlayerCards {
  const deck = createAndFormatDeck();
  const squeakDeck = deck.splice(0, 13);
  const squeakHand = [[], [], [], []];

  const hand: ICard[] = [];

  return {
    squeakDeck,
    squeakHand,
    deck,
    hand,
  };
}

export default generateDeckAndSqueakCards;
