import { type Server, type Socket } from "socket.io";
import { type IGameData } from "../socket";
import { type ICard } from "~/utils/generateDeckAndSqueakCards";

interface IDrawFromDeckBackendVersion {
  io: Server;
  gameData: IGameData;
  playerID: string;
  roomCode: string;
}

export function drawFromDeckHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
) {
  socket.on(
    "playerDrawFromDeck",
    ({ playerID, roomCode }: { playerID: string; roomCode: string }) =>
      drawFromDeck({
        io,
        gameData,
        playerID,
        roomCode,
      }),
  );
}

export function drawFromDeck({
  io,
  gameData,
  playerID,
  roomCode,
}: IDrawFromDeckBackendVersion) {
  const board = gameData[roomCode]?.board;
  const players = gameData[roomCode]?.players;
  const playerCards = gameData[roomCode]?.players[playerID];
  const deck = playerCards?.deck;
  const hand = playerCards?.hand;

  if (!playerCards || !players || !board || !deck || !hand) return;

  // resets the deck if the player has drawn all the cards.
  // this has it's own hook because there will be no cards to "target" to listen for
  // this event being emitted. Therefore we just listen for it on the main /game/[...code] component
  if (playerCards.deck.length === 0) {
    // updating the reference to the actual player object
    playerCards.deck = hand.reverse(); // in real life you would physically flip over the hand pile to become the deck
    playerCards.hand = [];

    io.in(roomCode).emit("playerDrawnFromDeck", {
      resetDeck: true,
      playerID,
      updatedPlayerCards: playerCards,
    });
    return;
  }

  let cardBeingAnimated: ICard | null = null;

  // cards are rendered on the client with the last card in the array at
  // the top of stack
  if (deck.length >= 3) {
    const firstTopCard = deck.pop();
    const secondTopCard = deck.pop();
    const thirdTopCard = deck.pop();

    if (
      thirdTopCard === undefined ||
      secondTopCard === undefined ||
      firstTopCard === undefined
    )
      return;

    hand.push(firstTopCard, secondTopCard, thirdTopCard);
    cardBeingAnimated = thirdTopCard;
  } else if (deck.length === 2) {
    const firstTopCard = deck.pop();
    const secondTopCard = deck.pop();

    if (firstTopCard === undefined || secondTopCard === undefined) return;

    hand.push(firstTopCard, secondTopCard);
    cardBeingAnimated = secondTopCard;
  } else if (deck.length === 1) {
    const firstTopCard = deck.pop();

    if (firstTopCard === undefined) return;

    hand.push(firstTopCard);
    cardBeingAnimated = firstTopCard;
  }

  io.in(roomCode).emit("playerDrawnFromDeck", {
    cardBeingAnimated,
    playerID,
    updatedPlayerCards: playerCards,
  });
}
