import { type Server } from "socket.io";
import cardPlacementIsValid from "../../../utils/cardPlacementIsValid";
import { type IGameData, type IRoomData, type IMiscRoomData } from "../socket";
import { generateAndEmitScoreboard } from "./roundOverHandler";
import { squeakToSqueak } from "../helpers/squeakToSqueak";
import { squeakToBoard } from "../helpers/squeakToBoard";
import { deckToBoard } from "../helpers/deckToBoard";
import { deckToSqueak } from "../helpers/deckToSqueak";
import { drawFromDeck } from "./drawFromDeckHandler";

export function botMoveHandler(
  io: Server,
  roomCode: string,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData,
  playerID: string
) {
  const players = gameData[roomCode]?.players;
  const miscRoomDataCopy = miscRoomData[roomCode];
  const bot = players?.[playerID];
  const squeakDeck = bot?.squeakDeck;
  const squeakHand = bot?.squeakHand;

  if (
    !bot ||
    !miscRoomDataCopy ||
    !squeakDeck ||
    !squeakHand ||
    miscRoomDataCopy.preventOtherPlayersFromSqueaking
  )
    return;

  // used to keep track of squeak cards that have been moved to other squeak cards so that
  // we don't move them back to the same squeak card infinitely. When a squeak card is moved
  // onto the board the key-value pair will be deleted from this object.
  // ^^ could have another reversed obj for easier lookup, but only do if ergonomics are worth it
  const blacklistedSqueakCards: {
    [stringifiedCard: string]: string;
  } = {};

  // 1st priority: bot has an exposed squeak button
  if (players[playerID]?.squeakHand[0]?.length === 0) {
    generateAndEmitScoreboard({
      io,
      gameData,
      roomData,
      miscRoomData,
      roundWinnerID: playerID,
      roomCode,
    });
    console.log("did 1st");
    return;
  }

  // 2nd priority: bot can open up a squeak stack (by moving either to the board or to another squeak stack)
  for (let stackIdx = 0; stackIdx < squeakHand.length; stackIdx++) {
    const stack = squeakHand[stackIdx];

    if (!stack) continue;
    for (let cardIdx = 0; cardIdx < stack.length; cardIdx++) {
      const card = stack[cardIdx];

      if (!card) continue;

      // ideally we want to place the card on the board to get an extra point
      // rather than just opening up the squeak stack spot

      // only allowed to play the card on the board at this point if it is the only card in the stack
      if (cardIdx === 0 && stack.length === 1) {
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 5; col++) {
            const cell = gameData[roomCode]?.board[row]?.[col];

            if (cell === undefined) continue;
            if (cardPlacementIsValid(cell, card.value, card.suit, true)) {
              squeakToBoard({
                gameData,
                card,
                playerID,
                roomCode,
                io,
                squeakStartLocation: stackIdx,
                boardEndLocation: { row, col },
              });

              // remove from blacklist if it was on there (existed as a value to a key)
              for (const key of Object.keys(blacklistedSqueakCards)) {
                if (
                  blacklistedSqueakCards[key] === `${card.value}${card.suit}`
                ) {
                  delete blacklistedSqueakCards[key];
                }
              }
              console.log("did 2nd");
              return;
            }
          }
        }
      }

      // need to make sure it is valid on OTHER stacks, not the same stack
      for (
        let otherStackIdx = 0;
        otherStackIdx < squeakHand.length;
        otherStackIdx++
      ) {
        const otherStack = squeakHand[otherStackIdx];

        if (!otherStack || stackIdx === otherStackIdx) continue;
        const bottomCard = otherStack[otherStack.length - 1];

        if (
          blacklistedSqueakCards[`${card.value}${card.suit}`] === undefined &&
          bottomCard &&
          cardPlacementIsValid(bottomCard, card.value, card.suit, false) &&
          cardIdx === 0 // only valid if moving the stack frees up a squeak spot
        ) {
          squeakToSqueak({
            gameData,
            card,
            playerID,
            roomCode,
            io,
            squeakStartLocation: stackIdx,
            squeakEndLocation: otherStackIdx,
          });

          // add to blacklist so we don't move it back to the same squeak stack
          blacklistedSqueakCards[
            `${card.value}${card.suit}`
          ] = `${bottomCard.value}${bottomCard.suit}`;
          console.log("did 2nd");

          return;
        }
      }
    }
  }

  // 3rd priority: bot can play a card from a squeak stack onto the board
  for (let stackIdx = 0; stackIdx < squeakHand.length; stackIdx++) {
    const stack = squeakHand[stackIdx];
    if (!stack) continue;

    const bottomCard = stack[stack.length - 1];
    if (!bottomCard) continue;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = gameData[roomCode]?.board[row]?.[col];

        if (cell === undefined) continue;
        if (
          cardPlacementIsValid(cell, bottomCard.value, bottomCard.suit, true)
        ) {
          squeakToBoard({
            gameData,
            card: bottomCard,
            playerID,
            roomCode,
            io,
            squeakStartLocation: stackIdx,
            boardEndLocation: { row, col },
          });

          // remove from blacklist if it was on there (existed as a value to a key)
          for (const key of Object.keys(blacklistedSqueakCards)) {
            if (
              blacklistedSqueakCards[key] ===
              `${bottomCard.value}${bottomCard.suit}`
            ) {
              delete blacklistedSqueakCards[key];
            }
          }
          console.log("did 3rd");
          return;
        }
      }
    }
  }

  // 4th priority: bot can play a card from the top card in their hand onto the board
  let topCardInHand = null;

  // cards are rendered on the client with the last card in the array at the top of stack
  for (let i = 2; i >= 0; i--) {
    const card = players[playerID]?.topCardsInDeck[i];
    if (card !== null) {
      topCardInHand = card;
      break;
    }
  }

  if (topCardInHand) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = gameData[roomCode]?.board[row]?.[col];

        if (cell === undefined) continue;
        if (
          cardPlacementIsValid(
            cell,
            topCardInHand.value,
            topCardInHand.suit,
            true
          )
        ) {
          deckToBoard({
            gameData,
            card: topCardInHand,
            playerID,
            roomCode,
            io,
            boardEndLocation: { row, col },
          });
          console.log("did 4th");
          return;
        }
      }
    }
  }

  // 5th priority: bot can play a card from their hand to a squeak stack
  if (topCardInHand) {
    for (let stackIdx = 0; stackIdx < squeakHand.length; stackIdx++) {
      const stack = squeakHand[stackIdx];

      if (!stack) continue;
      const bottomCard = stack[stack.length - 1];

      if (
        bottomCard &&
        cardPlacementIsValid(
          bottomCard,
          topCardInHand.value,
          topCardInHand.suit,
          false
        )
      ) {
        deckToSqueak({
          gameData,
          card: topCardInHand,
          playerID,
          roomCode,
          io,
          squeakEndLocation: stackIdx,
        });

        console.log("did 5th");
        return;
      }
    }
  }

  // 6th priority: bot can move a card/substack from a squeak stack to another squeak stack
  for (let stackIdx = 0; stackIdx < squeakHand.length; stackIdx++) {
    const stack = squeakHand[stackIdx];

    if (!stack) continue;
    for (let cardIdx = 0; cardIdx < stack.length; cardIdx++) {
      const card = stack[cardIdx];

      if (!card) continue;
      // need to make sure it is valid on OTHER stacks, not the same stack
      for (
        let otherStackIdx = 0;
        otherStackIdx < squeakHand.length;
        otherStackIdx++
      ) {
        const otherStack = squeakHand[otherStackIdx];

        if (!otherStack || stackIdx === otherStackIdx) continue;
        const bottomCard = otherStack[otherStack.length - 1];

        if (
          blacklistedSqueakCards[`${card.value}${card.suit}`] === undefined &&
          bottomCard &&
          cardPlacementIsValid(bottomCard, card.value, card.suit, false)
        ) {
          squeakToSqueak({
            gameData,
            card,
            playerID,
            roomCode,
            io,
            squeakStartLocation: stackIdx,
            squeakEndLocation: otherStackIdx,
          });

          // add to blacklist so we don't move it back to the same squeak stack
          blacklistedSqueakCards[
            `${card.value}${card.suit}`
          ] = `${bottomCard.value}${bottomCard.suit}`;
          console.log("did 6th");
          return;
        }
      }
    }
  }

  // 7th priority: bot needs to draw from their deck since there are no other valid moves
  drawFromDeck({
    io,
    gameData,
    playerID,
    roomCode,
  });
  console.log("did 7th");

  return;
}
