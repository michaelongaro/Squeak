import { useCallback, useMemo } from "react";
import { useRoomContext } from "../context/RoomContext";
import { type ICard } from "../utils/generateDeckAndSqueakCards";

interface IUseFilterCardsInHandFromDeck {
  array: ICard[] | undefined;
  playerID: string | undefined;
}

function useFilterCardsInHandFromDeck({
  array,
  playerID,
}: IUseFilterCardsInHandFromDeck) {
  const { gameData } = useRoomContext();

  const filterCardsInHandFromDeck = useCallback(() => {
    if (!playerID) return;

    const deckIdx = gameData.players[playerID]?.deckIdx;
    const cardsInHand = gameData.players[playerID]?.topCardsInDeck.filter(
      (card) => card !== null
    );
    if (!array || !deckIdx || !cardsInHand) return [];

    const filteredArray = array.filter(
      (card) =>
        !cardsInHand.some(
          (cardInHand) =>
            cardInHand?.suit === card.suit && cardInHand?.value === card.value
        )
    );

    return [...filteredArray];
  }, [gameData.players, array, playerID]);

  const memoizedFilterCardsInHandFromDeck = useMemo(
    () => filterCardsInHandFromDeck(),
    [filterCardsInHandFromDeck]
  );

  return memoizedFilterCardsInHandFromDeck;
}

export default useFilterCardsInHandFromDeck;
