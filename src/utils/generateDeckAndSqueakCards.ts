export interface ICard {
  value: string;
  suit: string;
}

export interface IPlayerCards {
  squeakDeck: ICard[];
  squeakHand: ICard[][];
  deck: ICard[];
  deckIdx: number;
  topCardsInDeck: (ICard | null)[];
  nextTopCardInDeck: ICard | null;
  totalPoints: number;
  rankInRoom: number;
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

// create a function that shuffles the deck
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

  const deckIdx = -1;
  const topCardsInDeck = [null, null, null];
  const nextTopCardInDeck = deck[2] || null;
  const totalPoints = 0;
  const rankInRoom = -1;

  return {
    squeakDeck,
    squeakHand,
    deck,
    deckIdx,
    topCardsInDeck,
    nextTopCardInDeck,
    totalPoints,
    rankInRoom,
  };
}

export default generateDeckAndSqueakCards;
