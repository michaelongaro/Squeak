import { type StaticImageData } from "next/image";
import { cardAssets } from "~/utils/cardAssetPaths";

interface IGetCardAssetPath {
  suit: string;
  value: string;
  deckVariantIndex: number;
  manuallyShowSpecificCardFront?: number;
  showCardBack?: boolean;
}

export function getCardAssetPath({
  suit,
  value,
  deckVariantIndex,
  manuallyShowSpecificCardFront,
  showCardBack,
}: IGetCardAssetPath): StaticImageData {
  if (showCardBack) {
    return cardAssets["cardBack"] as StaticImageData;
  }

  if (manuallyShowSpecificCardFront !== undefined) {
    return cardAssets[
      `${suit}${value}${manuallyShowSpecificCardFront === 1 ? "Simple" : ""}`
    ] as StaticImageData;
  }

  return cardAssets[
    `${suit}${value}${deckVariantIndex === 1 ? "Simple" : ""}`
  ] as StaticImageData;
}
