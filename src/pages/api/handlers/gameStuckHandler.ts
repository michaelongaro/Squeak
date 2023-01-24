import { type Server } from "socket.io";
import cardPlacementIsValid from "../../../utils/cardPlacementIsValid";
import {
  type ICard,
  type IPlayerCards,
} from "../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../socket";

export function gameStuckHandler(
  io: Server,
  gameData: IGameData,
  roomCode: string
) {
  console.log("game stuck handler called from interval");

  // on sighting of even *one* valid card, return from function. otherwise, emit game stuck

  // eventually move away from .map()s and use regular for loops so you can break out of them
  // when you find a valid card

  let validCardFound = false;

  const players = gameData[roomCode]?.players;

  if (!players) return;

  // for each player:
  Object.keys(players).map((playerID, idx) => {
    // get all avail cards from their deck that they can access from clicking deck
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
            console.log("valid card found, deck -> board");
            validCardFound = true;

            // does not look like these returns are jumping you out of WHOLE function,
            // just out of the .map?
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
          console.log("valid card found, deck -> squeak");
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
            console.log("valid card found, squeak -> board");
            validCardFound = true;
          }
        });
      });
    });

    // .map through each squeak stack and see if any indiv. card can be moved to bottom of
    // any other squeak stack (maybe simpler to store these bottom cards in an array for step 2 and this one?)
    // (maybe want to limit valid moves to only if it would free up a squeak spot?)

    player.squeakHand.map((stack, stackIdx) => {
      stack.map((card) => {
        // need to make sure it is valid on OTHER stacks, not the same stack
        player.squeakHand.map((otherStack, otherStackIdx) => {
          if (stackIdx !== otherStackIdx) {
            const bottomCard = otherStack[otherStack.length - 1];
            if (
              bottomCard &&
              cardPlacementIsValid(bottomCard, card.value, card.suit, false)
            ) {
              console.log("valid card found, squeak -> squeak");
              validCardFound = true;
            }
          }
        });
      });
    });
  });

  if (validCardFound) return;

  // if no valid card found, rotate all player's decks and emit new game data
  Object.keys(players).map((playerID, idx) => {
    const player = players[playerID];

    if (!player) return;

    player.deck = rotateDeckByOneCard(player.deck);
    player.deckIdx = -1;
    player.topCardsInDeck = [null, null, null];

    // not sure if this actually mutates the players/gameData object...
  });
  io.in(roomCode).emit("decksWereRotated", gameData[roomCode]);
}

function getReachableCardsFromDeck(player: IPlayerCards): ICard[] {
  let tempIdx = -1;
  const deck = player.deck;
  const availCards: ICard[] = [];

  if (player.deckIdx !== -1 && player.topCardsInDeck.includes(null)) {
    availCards.push(player.deck[player.deckIdx]!);
  }

  while (tempIdx !== deck.length - 1) {
    if (tempIdx + 3 <= deck.length - 1) {
      availCards.push(deck[tempIdx + 3]!);

      tempIdx = tempIdx + 3;
    } else {
      if (tempIdx + 2 === deck.length - 1) {
        availCards.push(deck[tempIdx + 2]!);
      } else if (tempIdx + 1 === deck.length - 1) {
        availCards.push(deck[tempIdx + 1]!);
      }

      tempIdx = deck.length - 1;
    }
  }
  // console.dir(availCards, { maxArrayLength: null });

  return availCards;
}

function rotateDeckByOneCard(deck: ICard[]): ICard[] {
  if (deck.length === 0) return deck;
  deck.push(deck.shift()!); // deck is never empty, so this should be fine
  return deck;
}
