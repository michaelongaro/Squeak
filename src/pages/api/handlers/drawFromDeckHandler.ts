import { type Server, type Socket } from "socket.io";
import { type IGameData, type IDrawFromDeck } from "../socket";

export function drawFromDeckHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData
) {
  function drawFromDeck({ playerID, roomCode }: IDrawFromDeck) {
    const playerCards = gameData[roomCode]?.players[playerID];
    let deckIdx = playerCards?.deckIdx;
    const deck = playerCards?.deck;
    let topCardsInDeck = playerCards?.topCardsInDeck;
    if (!playerCards || !deck || !deckIdx || !topCardsInDeck) return;

    // resets the deck if the player has drawn all the cards
    if (playerCards.nextTopCardInDeck === null) {
      // updating the reference to the actual player object
      playerCards.deckIdx = -1;
      playerCards.nextTopCardInDeck = deck[2] || null;
      playerCards.topCardsInDeck = [null, null, null];

      io.in(roomCode).emit("playerDrawnFromDeck", {
        nextTopCardInDeck: deck[2] || null,
        resetDeck: true,
        playerID,
        // updatedBoard: gameData[roomCode]?.board,
        updatedPlayerCards: playerCards, //
      });
      return;
    }

    // cards are rendered with the last card in the array at the top of stack
    if (deckIdx + 3 <= deck.length - 1) {
      topCardsInDeck = [
        deck[deckIdx + 1] || null,
        deck[deckIdx + 2] || null,
        deck[deckIdx + 3] || null,
      ];

      deckIdx + 3 === deck.length - 1 ? (deckIdx = -1) : (deckIdx += 3);
    } else {
      // maybe should be comparing to deck.length - 1 for all of these

      if (deckIdx + 2 === deck.length - 1) {
        topCardsInDeck = [
          null,
          deck[deckIdx + 1] || null,
          deck[deckIdx + 2] || null,
        ];
      } else if (deckIdx + 1 === deck.length - 1) {
        topCardsInDeck = [null, null, deck[deckIdx + 1] || null];
      } else {
        topCardsInDeck = [null, null, null];
      }
      deckIdx = -1;
    }

    const currentTopCardInDeck = playerCards.nextTopCardInDeck;

    // updating the reference to the actual player object
    if (deckIdx === -1) {
      playerCards.nextTopCardInDeck = null;
    } else {
      playerCards.nextTopCardInDeck =
        deck[deckIdx + 3] ?? deck[deckIdx + 2] ?? deck[deckIdx + 1] ?? null;
    }

    playerCards.deckIdx = deckIdx;
    playerCards.topCardsInDeck = topCardsInDeck;

    io.in(roomCode).emit("playerDrawnFromDeck", {
      nextTopCardInDeck: currentTopCardInDeck,
      playerID,
      updatedPlayerCards: playerCards,
    });
  }

  socket.on("playerDrawFromDeck", drawFromDeck);
}
