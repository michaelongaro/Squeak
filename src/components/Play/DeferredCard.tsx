import { useEffect, useState } from "react";
import Card from "~/components/Play/Card";
import StaticCard from "~/components/Play/StaticCard";

interface DeferredCard {
  value?: string;
  suit?: string;
  showCardBack?: boolean;
  draggable: boolean;
  origin: "deck" | "hand" | "squeakHand" | "squeakDeck";
  ownerID: string;
  startID: string;
  squeakStackLocation?: [number, number];
  rotation: number;
  hueRotation: number;
  width?: number;
  height?: number;
  zIndexOffset?: number;
  deckVariantIndex?: number;
  forceHighZIndex?: boolean;
}

// Since <Card> is such an incredibly heavy component, I was noticing especially on
// mobile devices that the card took a noticeable amount of time to render. This component
// is an attempt to work around this by rendering the card as a <StaticCard> first, purely just for
// the very first render, and then rendering the <Card> component afterwards.

function DeferredCard({
  value,
  suit,
  showCardBack,
  draggable,
  startID,
  origin,
  ownerID,
  rotation,
  squeakStackLocation,
  hueRotation,
  width,
  height,
  zIndexOffset,
  deckVariantIndex,
  forceHighZIndex,
}: DeferredCard) {
  const [showStaticCard, setShowStaticCard] = useState(true);

  useEffect(() => {
    setShowStaticCard(false);
  }, []);

  return (
    <div className="z-[500]">
      {showStaticCard ? (
        <StaticCard
          value={value || ""}
          suit={suit || ""}
          showCardBack={false}
          hueRotation={0}
          width={width}
          height={height}
          deckVariantIndex={deckVariantIndex || 0}
          forceHighZIndex={forceHighZIndex}
        />
      ) : (
        <Card
          value={value}
          suit={suit}
          showCardBack={showCardBack}
          draggable={draggable}
          startID={startID}
          origin={origin}
          ownerID={ownerID}
          squeakStackLocation={squeakStackLocation}
          rotation={rotation}
          hueRotation={hueRotation}
          width={width}
          height={height}
          zIndexOffset={zIndexOffset}
        />
      )}
    </div>
  );
}

export default DeferredCard;
