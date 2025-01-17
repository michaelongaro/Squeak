import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import React, { useEffect } from "react";
import { useRoomContext } from "../../../context/RoomContext";
import { motion, useAnimation } from "framer-motion";
import { type IRoomPlayersMetadata } from "~/pages/api/socket";
import StaticCard from "~/components/Play/StaticCard";

interface IAnimatedCardContainer {
  cards: ICard[];
  playerID: string;
  staggerCards?: boolean;
}

function AnimatedCardContainer({
  cards,
  playerID,
  staggerCards = true,
}: IAnimatedCardContainer) {
  const { playerMetadata, deckVariant } = useRoomContext();

  return (
    <div
      id={`scoreboardAnimatedCardContainer${playerID}`}
      style={{
        perspective: "450px",
        transformStyle: "preserve-3d",
      }}
      className="z-[2] h-[115px] w-full tablet:h-[165px]"
    >
      {cards.map((card, index) => (
        <AnimatedCard
          key={`${playerID}scoreboardAnimatedCard${index}`}
          playerMetadata={playerMetadata}
          card={card}
          playerID={playerID}
          index={index}
          totalCardsPlayed={cards.length}
          deckVariant={deckVariant}
          staggerCards={staggerCards}
        />
      ))}
    </div>
  );
}

export default AnimatedCardContainer;

interface IAnimatedCard {
  playerMetadata: IRoomPlayersMetadata;
  card: ICard;
  index: number;
  playerID: string;
  totalCardsPlayed: number;
  deckVariant: string;
  staggerCards: boolean;
}

function AnimatedCard({
  card,
  index,
  playerID,
  totalCardsPlayed,
  deckVariant,
  staggerCards,
}: IAnimatedCard) {
  const controls = useAnimation();

  useEffect(() => {
    const animatedCardContainer = document
      .getElementById(`scoreboardAnimatedCardContainer${playerID}`)
      ?.getBoundingClientRect();

    const animatedCard = document.getElementById(
      `scoreboardAnimatedCard${index}${playerID}`,
    );

    if (!animatedCardContainer || !animatedCard) return;

    const middleOfContainer = Math.floor(animatedCardContainer.width / 2);

    const spacingBetweenCards = 1;

    const offsetFromCenter =
      ((totalCardsPlayed - 1) / 2 - index) * spacingBetweenCards;

    const finalY = animatedCardContainer.height / 5 + offsetFromCenter;

    // Calculate delay and duration based on totalCardsPlayed
    const totalAnimationTime = 4000; // Total time (ms) for all cards to be played
    const delay = staggerCards
      ? 0.5 + (totalAnimationTime / totalCardsPlayed) * index
      : 0;
    const duration = staggerCards
      ? totalAnimationTime / totalCardsPlayed / 1000
      : 1; // convert to seconds

    // Start the animation
    controls.start({
      top: finalY,
      left: middleOfContainer,
      rotateX: 25,
      rotateZ: 50,
      transition: {
        delay: delay / 1000, // convert to seconds
        duration,
        ease: "easeOut",
      },
    });
  }, [playerID, index, totalCardsPlayed, controls, staggerCards]);

  return (
    <motion.div
      key={`${playerID}scoreboardAnimatedCard${index}`}
      id={`scoreboardAnimatedCard${index}${playerID}`}
      className="absolute"
      initial={{
        top: "-100%",
        left: "50%",
        x: "-43%", // not entirely sure why this magic number was needed, but -50% was too far to the left
        rotateX: 25,
        rotateZ: 50,
      }}
      animate={controls}
    >
      <StaticCard
        suit={card.suit}
        value={card.value}
        deckVariant={deckVariant}
      />
    </motion.div>
  );
}
