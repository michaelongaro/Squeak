import { type Server } from "socket.io";
import cardPlacementIsValid from "../../../utils/cardPlacementIsValid";
import { type IGameData, type IRoomData, type IMiscRoomData } from "../socket";
import { generateAndEmitScoreboard } from "./roundOverHandler";
import { squeakToSqueak } from "../helpers/squeakToSqueak";
import { squeakToBoard } from "../helpers/squeakToBoard";
import { deckToBoard } from "../helpers/deckToBoard";
import { deckToSqueak } from "../helpers/deckToSqueak";
import { drawFromDeck } from "./drawFromDeckHandler";
import { type ICard } from "../../../utils/generateDeckAndSqueakCards";

const minTimestampDelays = {
  Easy: 1500,
  Medium: 1000,
  Hard: 500,
};

export function botMoveHandler(
  io: Server,
  roomCode: string,
  gameData: IGameData,
  roomData: IRoomData,
  miscRoomData: IMiscRoomData,
  playerID: string
) {
  const players = gameData[roomCode]?.players;
  const miscRoomDataObj = miscRoomData[roomCode];
  const bot = players?.[playerID];
  const botDifficulty = roomData[roomCode]?.players?.[playerID]?.botDifficulty;
  const squeakDeck = bot?.squeakDeck;
  const squeakHand = bot?.squeakHand;
  const blacklistedSqueakCards =
    miscRoomDataObj?.blacklistedSqueakCards?.[playerID];

  if (
    !bot ||
    !miscRoomDataObj ||
    !squeakDeck ||
    !squeakHand ||
    miscRoomDataObj.preventOtherPlayersFromSqueaking ||
    !botDifficulty ||
    !blacklistedSqueakCards
  )
    return;

  // 1st priority: bot has an exposed squeak button
  if (players[playerID]?.squeakDeck.length === 0) {
    generateAndEmitScoreboard({
      io,
      gameData,
      roomData,
      miscRoomData,
      playerWhoSqueakedID: playerID,
      roomCode,
    });
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
        // check all board cells randomly, place if valid
        let foundValidCell = false;
        const flatBoard = generateFlatBoard();

        while (!foundValidCell || flatBoard.length === 0) {
          const cellCoordinates = getRandomUniqueBoardCell(flatBoard);

          if (!cellCoordinates) break;

          const { row, col } = cellCoordinates;

          const cell = gameData[roomCode]?.board[row]?.[col];

          if (cell === undefined) continue;
          if (cardPlacementIsValid(cell, card.value, card.suit, true)) {
            const needToWaitForTimestampLockout =
              Date.now() - (miscRoomDataObj.boardTimestamps[row]?.[col] || 0) <
              minTimestampDelays[botDifficulty];

            setTimeout(
              () => {
                const cardWasPlayedSuccessfully = squeakToBoard({
                  gameData,
                  miscRoomData,
                  card,
                  playerID,
                  roomCode,
                  io,
                  squeakStartLocation: stackIdx,
                  boardEndLocation: { row: row, col: col },
                });

                if (cardWasPlayedSuccessfully) {
                  // remove from blacklist if it was on there (existed as a value to a key)
                  for (const key of Object.keys(blacklistedSqueakCards)) {
                    if (
                      blacklistedSqueakCards[key] ===
                      `${card.value}${card.suit}`
                    ) {
                      delete blacklistedSqueakCards[key];
                    }
                  }
                }
              },
              needToWaitForTimestampLockout
                ? minTimestampDelays[botDifficulty]
                : 0
            );

            foundValidCell = true;
            return; // hopefully this return placement still works as expected
          } else {
            // remove the indicies from the array so we don't check them again
            flatBoard.splice(flatBoard.indexOf(cellCoordinates), 1);
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

    // check all board cells randomly, place if valid
    let foundValidCell = false;
    const flatBoard = generateFlatBoard();

    while (!foundValidCell || flatBoard.length === 0) {
      const cellCoordinates = getRandomUniqueBoardCell(flatBoard);

      if (!cellCoordinates) break;

      const { row, col } = cellCoordinates;

      const cell = gameData[roomCode]?.board[row]?.[col];

      if (cell === undefined) continue;
      if (cardPlacementIsValid(cell, bottomCard.value, bottomCard.suit, true)) {
        const needToWaitForTimestampLockout =
          Date.now() - (miscRoomDataObj.boardTimestamps[row]?.[col] || 0) <
          minTimestampDelays[botDifficulty];

        setTimeout(
          () => {
            const cardWasPlayedSuccessfully = squeakToBoard({
              gameData,
              miscRoomData,
              card: bottomCard,
              playerID,
              roomCode,
              io,
              squeakStartLocation: stackIdx,
              boardEndLocation: { row, col },
            });

            if (cardWasPlayedSuccessfully) {
              // remove from blacklist if it was on there (existed as a value to a key)
              for (const key of Object.keys(blacklistedSqueakCards)) {
                if (
                  blacklistedSqueakCards[key] ===
                  `${bottomCard.value}${bottomCard.suit}`
                ) {
                  delete blacklistedSqueakCards[key];
                }
              }
            }
          },
          needToWaitForTimestampLockout ? minTimestampDelays[botDifficulty] : 0
        );
        foundValidCell = true;

        return;
      } else {
        // remove the indicies from the array so we don't check them again
        flatBoard.splice(flatBoard.indexOf(cellCoordinates), 1);
      }
    }
  }

  // 4th priority: bot can play a card from the top card in their hand onto the board
  let topCardInHand: ICard | null | undefined = null;

  // cards are rendered on the client with the last card in the array at the top of stack
  for (let i = 2; i >= 0; i--) {
    const card = players[playerID]?.topCardsInDeck[i];
    if (card !== null) {
      topCardInHand = card;
      break;
    }
  }

  if (topCardInHand) {
    // check all board cells randomly, place if valid
    let foundValidCell = false;
    const flatBoard = generateFlatBoard();

    while (!foundValidCell || flatBoard.length === 0) {
      const cellCoordinates = getRandomUniqueBoardCell(flatBoard);

      if (!cellCoordinates) break;

      const { row, col } = cellCoordinates;

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
        const needToWaitForTimestampLockout =
          Date.now() - (miscRoomDataObj.boardTimestamps[row]?.[col] || 0) <
          minTimestampDelays[botDifficulty];

        setTimeout(
          () => {
            deckToBoard({
              gameData,
              miscRoomData,
              card: topCardInHand as ICard,
              playerID,
              roomCode,
              io,
              boardEndLocation: { row, col },
            });
          },
          needToWaitForTimestampLockout ? minTimestampDelays[botDifficulty] : 0
        );
        foundValidCell = true;
        return;
      } else {
        // remove the indicies from the array so we don't check them again
        flatBoard.splice(flatBoard.indexOf(cellCoordinates), 1);
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

  return;
}

function getRandomUniqueBoardCell(
  flatBoard: Array<{ row: number; col: number }>
) {
  if (flatBoard.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * flatBoard.length);
  const randomCell = flatBoard[randomIndex];

  if (randomCell === undefined) {
    return null;
  }

  return {
    row: randomCell.row,
    col: randomCell.col,
  };
}

function generateFlatBoard() {
  const flatBoard = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 5; j++) {
      flatBoard.push({ row: i, col: j });
    }
  }

  return flatBoard;
}
