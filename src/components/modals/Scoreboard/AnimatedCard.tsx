import anime from "animejs";
import React, { useEffect, useState } from "react";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import Card from "../../Play/Card";

interface IAnimatedCard {
  card: ICard;
  index: number;
  playerID: string;
}

function AnimatedCard({ card, index, playerID }: IAnimatedCard) {
  const [animationStarted, setAnimationStarted] = useState(false); // not sure if necessary

  useEffect(() => {
    if (animationStarted) return;

    setAnimationStarted(true);

    const animatedCardContainer = document
      .getElementById(`scoreboardAnimatedCardContainer${playerID}`)
      ?.getBoundingClientRect();

    const animatedCard = document.getElementById(
      `scoreboardAnimatedCard${index}${playerID}`
    );

    if (!animatedCardContainer || !animatedCard) return;

    // maybe want all cards to be equally spaced out horizontally? just Math.floor(containerWidth / idx)
    const initX = Math.floor(
      Math.random() * (animatedCardContainer.width - 50) + 50
    );

    const initY = Math.floor(Math.random() * -375) - 100;

    const { initXRotation, initYRotation, initZRotation } = {
      initXRotation: Math.floor(Math.random() * 35) + 50,
      initYRotation: Math.floor(Math.random() * 50),
      initZRotation: Math.floor(Math.random() * 50),
    };

    const finalX =
      Math.floor(Math.random() * (animatedCardContainer.width - 50)) + 50;
    const finalY = Math.floor(
      Math.random() * animatedCardContainer.height * 0.1 +
        animatedCardContainer.height +
        50
    );

    const finalXRotation = Math.floor(Math.random() * 90);
    const finalYRotation = Math.floor(Math.random() * 50);
    const finalZRotation = Math.floor(Math.random() * 90);

    anime({
      targets: `#scoreboardAnimatedCard${index}${playerID}`,

      top: [`${initY}px`, `${finalY}px`],
      left: [`${initX}px`, `${finalX}px`],
      rotateX: [`${initXRotation}deg`, `${finalXRotation}deg`],
      rotateY: [`${initYRotation}deg`, `${finalYRotation}deg`],
      rotateZ: [`${initZRotation}deg`, `${finalZRotation}deg`],

      delay: index * 100,
      duration: 4500,
      loop: false,
      direction: "normal",
      easing: "easeOutQuad", // easeInOut?,
    });
  }, [playerID, index, animationStarted]);

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
        rotation={0}
      />
    </div>
  );
}

export default AnimatedCard;
