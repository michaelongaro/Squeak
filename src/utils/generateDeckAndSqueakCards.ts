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

export function createAndFormatDeck(): ICard[] {
  const deck: ICard[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 13; j++) {
      deck.push({
        value: values[j] as string,
        suit: suits[i] as string,
      });
    }
  }

  return shuffleDeck(deck);
}

function shuffleDeck(deck: ICard[]): ICard[] {
  const shuffledDeck: ICard[] = [];

  while (deck.length > 0) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    if (deck[randomIndex] === undefined) continue;
    const card: ICard = deck[randomIndex] as ICard;
    shuffledDeck.push(card);
    deck.splice(randomIndex, 1);
  }

  return shuffledDeck;
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
