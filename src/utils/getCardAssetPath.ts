import { type StaticImageData } from "next/image";
import { cardAssets } from "~/utils/cardAssetPaths";

interface IGetCardAssetPath {
  suit: string;
  value: string;
  deckVariant: string;
  showCardBack?: boolean;
}

export function getCardAssetPath({
  suit,
  value,
  deckVariant,
  showCardBack,
}: IGetCardAssetPath): StaticImageData {
  if (showCardBack) {
    return cardAssets["cardBack"] as StaticImageData;
  }

  return cardAssets[`${suit}${value}${deckVariant}`] as StaticImageData;
}
