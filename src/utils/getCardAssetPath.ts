import { type StaticImageData } from "next/image";
import { cardAssets } from "~/utils/cardAssetPaths";
import {
  DEFAULT_DECK_VARIANT,
  normalizeCardBackVariant,
  normalizeDeckVariant,
} from "~/utils/playerMetadataDefaults";

interface IGetCardAssetPath {
  suit: string;
  value: string;
  deckVariant: string;
  showCardBack?: boolean;
  cardBackVariant?: string;
}

export function getCardAssetPath({
  suit,
  value,
  deckVariant,
  showCardBack,
  cardBackVariant = "Standard",
}: IGetCardAssetPath): StaticImageData {
  if (showCardBack) {
    const backKey = `cardBack${normalizeCardBackVariant(cardBackVariant)}`;
    return (cardAssets[backKey] ??
      cardAssets["cardBackStandard"]) as StaticImageData;
  }

  const normalizedDeckVariant = normalizeDeckVariant(deckVariant);
  const cardFrontKey = `${suit}${value}${normalizedDeckVariant}`;
  const fallbackCardFrontKey = `${suit}${value}${DEFAULT_DECK_VARIANT}`;

  return (cardAssets[cardFrontKey] ??
    cardAssets[fallbackCardFrontKey]) as StaticImageData;
}
