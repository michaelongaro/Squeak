import type { ICard } from "~/utils/generateDeckAndSqueakCards";

export function cardsMatch(actual: ICard | undefined, proposed: ICard) {
  return actual?.value === proposed.value && actual?.suit === proposed.suit;
}
