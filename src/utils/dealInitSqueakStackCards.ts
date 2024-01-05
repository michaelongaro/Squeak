import { type IInitSqueakStackCardBeingDealt } from "../context/RoomContext";
import {
  type IGameMetadata,
  type IRoomPlayersMetadata,
} from "../pages/api/socket";

interface IDealInitSqueakStackCards {
  players: IRoomPlayersMetadata;
  gameData: IGameMetadata;
  setInitSqueakStackCardBeingDealt: React.Dispatch<
    React.SetStateAction<IInitSqueakStackCardBeingDealt | null>
  >;
}

export default function dealInitSqueakStackCards({
  players,
  gameData,
  setInitSqueakStackCardBeingDealt,
}: IDealInitSqueakStackCards) {
  for (const index in Object.keys(players)) {
    const playerID = Object.keys(players)[parseInt(index)];
    // console.log("playerID", playerID);

    if (playerID === undefined) return;

    // get top four cards from player's squeak deck
    const topFourCards = gameData.players?.[playerID]?.squeakDeck
      .slice(-4)
      .toReversed();

    if (!topFourCards || topFourCards.length !== 4) return;

    const modifiedIndex = parseInt(index);

    setTimeout(() => {
      console.log("sent out", 0, playerID);
      setInitSqueakStackCardBeingDealt({
        location: `${playerID}-${topFourCards![0]?.value}${
          topFourCards![0]?.suit
        }`,
        indexToDealTo: 0,
      });
    }, 0 + modifiedIndex * 500);

    setTimeout(() => {
      console.log("sent out", 1, playerID);
      setInitSqueakStackCardBeingDealt({
        location: `${playerID}-${topFourCards![1]?.value}${
          topFourCards![1]?.suit
        }`,
        indexToDealTo: 1,
      });
    }, 500 + modifiedIndex * 500);

    setTimeout(() => {
      console.log("sent out", 2, playerID);
      setInitSqueakStackCardBeingDealt({
        location: `${playerID}-${topFourCards![2]?.value}${
          topFourCards![2]?.suit
        }`,
        indexToDealTo: 2,
      });
    }, 1000 + modifiedIndex * 500);

    setTimeout(() => {
      console.log("sent out", 3, playerID);
      setInitSqueakStackCardBeingDealt({
        location: `${playerID}-${topFourCards![3]?.value}${
          topFourCards![3]?.suit
        }`,
        indexToDealTo: 3,
      });
    }, 1500 + modifiedIndex * 500);
  }
}

// try the same 500ms delay baseline + 400, but start at either 0 or 500 right?
