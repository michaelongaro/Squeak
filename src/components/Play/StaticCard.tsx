import { getCardAssetPath } from "~/utils/getCardAssetPath";

interface IStaticCard {
  suit: string;
  value: string;
  deckVariantIndex: number;
  showCardBack?: boolean;
  hueRotation?: number;
  width?: number;
  height?: number;
  forceHighZIndex?: boolean;
}

function StaticCard({
  suit,
  value,
  deckVariantIndex,
  showCardBack = false,
  hueRotation = 0,
  width,
  height,
  forceHighZIndex,
}: IStaticCard) {
  return (
    <img
      fetchPriority="high"
      style={{
        ...(width !== undefined &&
          height !== undefined && {
            width: `${width}px`,
            height: `${height}px`,
          }),
        filter: `hue-rotate(${hueRotation}deg)`,
      }}
      className={`cardDimensions rounded-[0.15rem] ${forceHighZIndex ? "relative isolate !z-[500]" : ""}`}
      src={
        getCardAssetPath({
          suit,
          value,
          deckVariantIndex,
          showCardBack,
        }).src
      }
      alt={`${value}${suit} card`}
      draggable="false"
    />
  );
}

export default StaticCard;
