import { type Server } from "socket.io";
import cardPlacementIsValid from "../../../utils/cardPlacementIsValid";
import {
  type ICard,
  type IPlayerCards,
} from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData, type IMiscRoomData } from "../socket";

// TODO: move away from .map()s and use regular for loops so you can break out of them
// when you find a valid card

export function gameStuckHandler(
  io: Server,
  roomCode: string,
  gameData: IGameData,
  miscRoomData: IMiscRoomData
) {
  // on sighting of even *one* valid move, return from function. otherwise, emit game stuck

  let validCardFound = false;

  const players = gameData[roomCode]?.players;
  const miscRoomDataCopy = miscRoomData[roomCode];

  if (!players || !miscRoomDataCopy) return;

  // for each player:
  Object.keys(players).map((playerID, idx) => {
    // get all avail cards from their deck that they can access from clicking on their deck
    // .map through and check if any board cell / bottom of any of their four squeak
    // stacks is valid move

    const player = players[playerID];
    const board = gameData[roomCode]?.board;
    if (!player || !board) return;

    const availCardsFromDeck = getReachableCardsFromDeck(player);

    availCardsFromDeck.map((card) => {
      // check if valid on any board cell
      board.map((row) => {
        row.map((cell) => {
          if (cardPlacementIsValid(cell, card.value, card.suit, true)) {
            validCardFound = true;
          }
        });
      });

      // check if valid on bottom of any of player's four squeak stacks
      player.squeakHand.map((stack) => {
        const bottomCard = stack[stack.length - 1];
        if (
          bottomCard &&
          cardPlacementIsValid(bottomCard, card.value, card.suit, false)
        ) {
          validCardFound = true;
        }
      });
    });

    // .map through bottom cards of each squeak stack and check if valid on any board cell
    player.squeakHand.map((stack) => {
      const bottomCard = stack[stack.length - 1];
      if (!bottomCard) return;

      board.map((row) => {
        row.map((cell) => {
          if (
            cardPlacementIsValid(cell, bottomCard.value, bottomCard.suit, true)
          ) {
            validCardFound = true;
          }
        });
      });
    });

    // .map through each squeak stack and see if any substack can be moved to bottom of
    // any other squeak stack. Only valid if moving the substack frees up a squeak spot
    player.squeakHand.map((stack, stackIdx) => {
      stack.map((card, cardIndex) => {
        // need to make sure it is valid on OTHER stacks, not the same stack
        player.squeakHand.map((otherStack, otherStackIdx) => {
          if (stackIdx !== otherStackIdx) {
            const bottomCard = otherStack[otherStack.length - 1];
            if (
              bottomCard &&
              cardPlacementIsValid(bottomCard, card.value, card.suit, false) &&
              cardIndex === 0 // only valid if moving the stack frees up a squeak spot
            ) {
              validCardFound = true;
            }
          }
        });
      });
    });
  });

  if (validCardFound) return;

  // hard limit on how many times to rotate decks before saying that
  // the game is fully stuck (necessary cards to progress are inside squeak pile
  // or inside other squeak stacks)
  if (miscRoomDataCopy.rotateDecksCounter === 8) {
    io.in(roomCode).emit("manuallyResetRound");
    return;
  }

  miscRoomDataCopy.rotateDecksCounter++;

  // if no valid card found, rotate all player's decks and emit new game data
  Object.keys(players).map((playerID, idx) => {
    const player = players[playerID];

    if (!player) return;

    player.deck = rotateDeckByOneCard(player.deck);
    player.deckIdx = -1;
    player.topCardsInDeck = [null, null, null];
    player.nextTopCardInDeck =
      player.deck[2] ?? player.deck[1] ?? player.deck[0] ?? null;
  });
  io.in(roomCode).emit("decksWereRotated", gameData[roomCode]);
}

function getReachableCardsFromDeck(player: IPlayerCards): ICard[] {
  let tempIdx = -1;
  const deck = player.deck;
  const availCards: ICard[] = [];

  // if a player has played a card or two from their hand, then we want to include
  // their currently visible top card because on a fresh runthrough of their deck
  // from -1 index, they will not be able to access that current top card
  if (
    player.deckIdx !== -1 &&
    player.topCardsInDeck[2] === null &&
    player.topCardsInDeck[0] !== null
  ) {
    // pushes on their currently visible top card
    availCards.push(player.deck[player.deckIdx]!);
  }

  while (tempIdx !== deck.length - 1) {
    if (tempIdx + 3 <= deck.length - 1) {
      availCards.push(deck[tempIdx + 3]!);

      tempIdx += 3;
    } else {
      if (tempIdx + 2 === deck.length - 1) {
        availCards.push(deck[tempIdx + 2]!);
      } else if (tempIdx + 1 === deck.length - 1) {
        availCards.push(deck[tempIdx + 1]!);
      }

      tempIdx = deck.length - 1;
    }
  }

  return availCards;
}

function rotateDeckByOneCard(deck: ICard[]): ICard[] {
  if (deck.length === 0 || deck.length === 1) return deck;
  deck.push(deck.shift()!); // deck isn't empty here, so this should be fine
  return deck;
}
