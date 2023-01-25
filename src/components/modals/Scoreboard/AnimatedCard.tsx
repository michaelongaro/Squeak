import anime from "animejs";
import React, { useEffect } from "react";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";
import Card from "../../Play/Card";

interface IAnimatedCard {
  card: ICard;
  index: number;
  playerID: string;
}

function AnimatedCard({ card, index, playerID }: IAnimatedCard) {
  useEffect(() => {
    const animatedCardContainer = document
      .getElementById(`${playerID}scoreboardAnimatedCardContainer`)
      ?.getBoundingClientRect();

    if (!animatedCardContainer) return;

    console.log("got thsi far");

    const initX = Math.floor(
      Math.random() * (animatedCardContainer.width - 50) + 50
    );
    const initY = Math.floor(Math.random() * -50);

    const { initXRotation, initYRotation, initZRotation } = {
      initXRotation: Math.floor(Math.random() * 50),
      initYRotation: Math.floor(Math.random() * 50),
      initZRotation: Math.floor(Math.random() * 50),
    };

    const halfwayX = Math.floor(
      Math.random() * (animatedCardContainer.width - 50) + 50
    );
    const halfwayY = Math.floor(animatedCardContainer.height * 0.5);

    const halfwayXRotation = Math.floor(Math.random() * 50);
    const halfwayYRotation = Math.floor(Math.random() * 50);
    const halfwayZRotation = Math.floor(Math.random() * 50);

    const finalX =
      Math.floor(Math.random() * (animatedCardContainer.width - 50)) + 50;
    const finalY = Math.floor(
      Math.random() * animatedCardContainer.height * 0.1 +
        animatedCardContainer.height
    );

    const finalXRotation = Math.floor(Math.random() * 50);
    const finalYRotation = Math.floor(Math.random() * 50);
    const finalZRotation = Math.floor(Math.random() * 50);

    console.table([
      {
        initX,
        initY,
        initXRotation,
        initYRotation,
        initZRotation,
      },
      {
        halfwayX,
        halfwayY,
        halfwayXRotation,
        halfwayYRotation,
        halfwayZRotation,
      },
      {
        finalX,
        finalY,
        finalXRotation,
        finalYRotation,
        finalZRotation,
      },
    ]);

    anime({
      targets: `#${playerID}scoreboardAnimatedCard${index}`,

      keyframes: [
        {
          top: `${initY}px`,
          // left: `${initX}px`,
          // rotateX: `${initXRotation}deg`,
          // rotateY: `${initYRotation}deg`,
          // rotateZ: `${initZRotation}deg`,
          // opacity: 0, // maybe need to increase this to 100% quicker than 50%
        }, // init
        {
          top: `${halfwayY}px`,
          // left: `${halfwayX}px`,
          // rotateX: `${halfwayXRotation}deg`,
          // rotateY: `${halfwayYRotation}deg`,
          // rotateZ: `${halfwayZRotation}deg`,
          // opacity: 1,
        }, // 50%
        {
          top: `${finalY}px`,
          // left: `${finalX}px`,
          // rotateX: `${finalXRotation}deg`,
          // rotateY: `${finalYRotation}deg`,
          // rotateZ: `${finalZRotation}deg`,
        }, // 100%
      ],

      delay: 350,
      duration: 1000,
      loop: false,
      direction: "normal",
      easing: "easeInSine", // easeInOut?,
    });
  }, [playerID, index]);

  return (
    <div
      key={`${playerID}scoreboardAnimatedCard${index}`}
      id={`${playerID}scoreboardAnimatedCard${index}`}
      className="absolute top-[-50px] left-0 h-full w-full"
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
