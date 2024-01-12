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
      className="absolute left-0 top-0 z-[2] h-full w-full "
    >
      {cards.map((card, index) => (
        <AnimatedCard
          key={`${playerID}scoreboardAnimatedCard${index}`}
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
