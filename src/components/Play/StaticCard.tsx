import { getCardAssetPath } from "~/utils/getCardAssetPath";

interface IStaticCard {
  suit: string;
  value: string;
  deckVariant: string;
  showCardBack?: boolean;
  cardBackVariant?: string;
  hueRotation?: number;
  width?: number;
  height?: number;
}

function StaticCard({
  suit,
  value,
  deckVariant,
  showCardBack = false,
  cardBackVariant,
  hueRotation = 0,
  width,
  height,
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
      className="cardDimensions rounded-[0.2rem]"
      src={
        getCardAssetPath({
          suit,
          value,
          deckVariant,
          showCardBack,
          cardBackVariant,
        }).src
      }
      alt={`${value}${suit} card`}
      draggable="false"
    />
  );
}

export default StaticCard;
