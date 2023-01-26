import AnimatedCard from "./AnimatedCard";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";

interface IAnimatedCardContainer {
  cards: ICard[];
  playerID: string;
}

function AnimatedCardContainer({ cards, playerID }: IAnimatedCardContainer) {
  return (
    <div
      id={`scoreboardAnimatedCardContainer${playerID}`}
      style={{
        perspective: "450px",
        transformStyle: "preserve-3d",
      }}
      className="absolute top-0 left-0 z-[2] h-full w-full "
    >
      {cards.map((card, index) => (
        <AnimatedCard
          key={`${playerID}scoreboardAnimatedCard${index}`}
          card={card}
          playerID={playerID}
          index={index}
        />
      ))}
    </div>
  );
}

export default AnimatedCardContainer;
