import { type StaticImageData } from "next/image";
import { cardAssets } from "~/utils/cardAssetPaths";

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
    const backKey = `cardBack${cardBackVariant}`;
    return (cardAssets[backKey] ??
      cardAssets["cardBackStandard"]) as StaticImageData;
  }

  return cardAssets[`${suit}${value}${deckVariant}`] as StaticImageData;
}
