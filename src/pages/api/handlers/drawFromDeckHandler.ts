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

    // cards are rendered with the last card in the array at the top of stack
    if (deckIdx + 3 <= deck.length) {
      topCardsInDeck = [
        deck[deckIdx + 1] || null,
        deck[deckIdx + 2] || null,
        deck[deckIdx + 3] || null,
      ];

      deckIdx + 3 === deck.length ? (deckIdx = -1) : (deckIdx = deckIdx + 3);
    } else {
      if (deckIdx + 2 === deck.length) {
        topCardsInDeck = [
          null,
          deck[deckIdx + 1] || null,
          deck[deckIdx + 2] || null,
        ];
      } else if (deckIdx + 1 === deck.length) {
        topCardsInDeck = [null, null, deck[deckIdx + 1] || null];
      } else {
        topCardsInDeck = [null, null, null];
      }
      deckIdx = -1;
    }

    const currentTopCardInDeck = playerCards.nextTopCardInDeck;

    // updating the reference to the actual player object
    playerCards.nextTopCardInDeck =
      deck[deckIdx + 3] ?? deck[deckIdx + 2] ?? deck[deckIdx + 1] ?? null;
    playerCards.deckIdx = deckIdx;
    playerCards.topCardsInDeck = topCardsInDeck;

    io.in(roomCode).emit("playerDrawnFromDeck", {
      nextTopCardInDeck: currentTopCardInDeck,
      playerID,
      updatedBoard: gameData[roomCode]?.board,
      updatedPlayerCards: gameData[roomCode]?.players,
    });
  }

  socket.on("playerDrawFromDeck", drawFromDeck);
}
