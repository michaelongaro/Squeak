import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import React, { useEffect } from "react";
import { useRoomContext } from "../../../context/RoomContext";
import Card from "../../Play/Card";
import { motion, useAnimation } from "framer-motion";
import { type IRoomPlayersMetadata } from "~/pages/api/socket";

interface IAnimatedCardContainer {
  cards: ICard[];
  playerID: string;
}

function AnimatedCardContainer({ cards, playerID }: IAnimatedCardContainer) {
  const { playerMetadata } = useRoomContext();

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
}

function AnimatedCard({
  card,
  index,
  playerID,
  totalCardsPlayed,
}: IAnimatedCard) {
  const { playerMetadata } = useRoomContext();
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
    const finalY = Math.floor(animatedCardContainer.height * 0.25) - index;

    // Calculate delay and duration based on totalCardsPlayed
    const totalAnimationTime = 4000; // Total time (ms) for all cards to be played
    const delay = (totalAnimationTime / totalCardsPlayed) * index;
    const duration = totalAnimationTime / totalCardsPlayed / 1000; // convert to seconds

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
  }, [playerID, index, totalCardsPlayed, controls]);

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
      <Card
        value={card.value}
        suit={card.suit}
        draggable={false}
        hueRotation={playerMetadata[playerID]?.deckHueRotation || 0}
        rotation={0}
      />
    </motion.div>
  );
}
