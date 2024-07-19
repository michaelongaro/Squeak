import anime from "animejs";
import React, { useEffect, useState } from "react";
import { useRoomContext } from "../../../context/RoomContext";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import Card from "../../Play/Card";

interface IAnimatedCard {
  card: ICard;
  index: number;
  playerID: string;
  totalCardsPlayed: number;
}

// TODO: take out animejs dependency altogether and just use css animations
// and or framer motion right?

function AnimatedCard({
  card,
  index,
  playerID,
  totalCardsPlayed,
}: IAnimatedCard) {
  const { playerMetadata } = useRoomContext();
  const [animationStarted, setAnimationStarted] = useState(false); // not sure if necessary

  useEffect(() => {
    if (animationStarted) return;

    setAnimationStarted(true);

    const animatedCardContainer = document
      .getElementById(`scoreboardAnimatedCardContainer${playerID}`)
      ?.getBoundingClientRect();

    const animatedCard = document.getElementById(
      `scoreboardAnimatedCard${index}${playerID}`,
    );

    if (!animatedCardContainer || !animatedCard) return;

    const middleOfContainer = Math.floor(animatedCardContainer.width / 2) - 25;

    const finalY = Math.floor(animatedCardContainer.height * 0.25) - index;

    // Calculate delay and duration based on totalCardsPlayed
    const totalAnimationTime = 4000; // Total time (ms) for all cards to be played
    const delay = (totalAnimationTime / totalCardsPlayed) * index;
    const duration = totalAnimationTime / totalCardsPlayed;

    anime({
      targets: `#scoreboardAnimatedCard${index}${playerID}`,

      top: [`${animatedCardContainer.height * -1}px`, `${finalY}px`],
      left: [`${middleOfContainer}px`, `${middleOfContainer}px`],
      rotateX: ["25deg", `25deg`],
      rotateZ: ["50deg", "50deg"],

      delay,
      duration,
      loop: false,
      direction: "normal",
      easing: "easeOutQuad",
    });
  }, [playerID, index, animationStarted, totalCardsPlayed]);

  return (
    <div
      key={`${playerID}scoreboardAnimatedCard${index}`}
      id={`scoreboardAnimatedCard${index}${playerID}`}
      className="absolute"
    >
      <Card
        value={card.value}
        suit={card.suit}
        draggable={false}
        hueRotation={playerMetadata[playerID]?.deckHueRotation || 0}
        rotation={0}
      />
    </div>
  );
}

export default AnimatedCard;
