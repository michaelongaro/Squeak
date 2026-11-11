import { createDeck, type ICard } from "./generateDeckAndSqueakCards";

const fullDeck = createDeck();

export function calculateCardsPlayedDuringRound(
  ...remainingPiles: ICard[][]
): ICard[] {
  const remaining = new Set(
    remainingPiles.flat().map((card) => `${card.value}${card.suit}`),
  );
  return fullDeck.filter((card) => !remaining.has(`${card.value}${card.suit}`));
}
