import type { ICard } from "../src/utils/generateDeckAndSqueakCards";
import assert from "node:assert/strict";
import test from "node:test";
import type { Server } from "socket.io";
import type {
  IGameData,
  IMiscRoomData,
  IPlayer,
  PlayerSocket,
} from "../src/types/socket";
import { handToBoard } from "../src/server/socket/helpers/handToBoard";
import { handToSqueak } from "../src/server/socket/helpers/handToSqueak";
import { squeakToBoard } from "../src/server/socket/helpers/squeakToBoard";
import { squeakToSqueak } from "../src/server/socket/helpers/squeakToSqueak";
import { drawFromSqueakDeck } from "../src/server/socket/helpers/drawFromSqueakDeck";
import { drawInitialSqueakStackCardFromDeck } from "../src/server/socket/helpers/drawInitialSqueakStackCardFromDeck";
import { scheduleRoundTask } from "../src/server/socket/helpers/scheduleRoundTask";
import {
  drawFromDeck,
  drawFromDeckHandler,
} from "../src/server/socket/handlers/drawFromDeckHandler";
import { proposedCardDropHandler } from "../src/server/socket/handlers/proposedCardDropHandler";
import cardPlacementIsValid from "../src/utils/cardPlacementIsValid";
import generateDeckAndSqueakCards, {
  createDeck,
  createAndFormatDeck,
} from "../src/utils/generateDeckAndSqueakCards";
import { calculateCardsPlayedDuringRound } from "../src/utils/calculateCardsPlayedDuringRound";

const ace = { value: "A", suit: "H" };
const two = { value: "2", suit: "C" };
const three = { value: "3", suit: "H" };

function fixture() {
  const player: IPlayer = {
    deck: [],
    hand: [],
    squeakDeck: [],
    squeakHand: [[], [], [], []],
    totalPoints: 0,
    rankInRoom: 1,
  };
  const gameData: IGameData = {
    TEST: {
      board: Array.from({ length: 4 }, () => Array<ICard | null>(5).fill(null)),
      players: { player },
      currentRound: 1,
      playerIDsThatLeftMidgame: [],
    },
  };
  const miscRoomData: IMiscRoomData = {
    TEST: {
      boardTimestamps: Array.from({ length: 4 }, () =>
        Array<number>(5).fill(0),
      ),
      preventOtherPlayersFromSqueaking: false,
      botIntervals: [],
      blacklistedSqueakCards: {},
      scoreboardMetadata: null,
      currentVotes: [],
      voteType: null,
    },
  };
  const events: { event: string; payload: unknown }[] = [];
  const io = {
    in: () => ({
      emit: (event: string, payload: unknown) =>
        events.push({ event, payload }),
    }),
  } as unknown as Server;
  return {
    io,
    gameData,
    miscRoomData,
    playerID: "player",
    roomCode: "TEST",
    player,
    board: gameData.TEST!.board,
    events,
  };
}

void test("dealing preserves exactly 52 distinct cards and a 13-card squeak deck", () => {
  for (let i = 0; i < 20; i++) {
    const cards = generateDeckAndSqueakCards();
    assert.equal(cards.deck.length, 39);
    assert.equal(cards.squeakDeck.length, 13);
    assert.equal(
      new Set([...cards.deck, ...cards.squeakDeck].map((c) => c.value + c.suit))
        .size,
      52,
    );
    assert.deepEqual(cards.squeakHand, [[], [], [], []]);
  }
  assert.equal(createAndFormatDeck().length, 52);
});

void test("board piles ascend in the same suit and stop at kings", () => {
  assert.equal(cardPlacementIsValid(null, "A", "H", true), true);
  assert.equal(cardPlacementIsValid(null, "2", "H", true), false);
  assert.equal(cardPlacementIsValid(ace, "2", "H", true), true);
  assert.equal(cardPlacementIsValid(ace, "2", "C", true), false);
  assert.equal(
    cardPlacementIsValid({ value: "K", suit: "H" }, "A", "H", true),
    false,
  );
});

void test("squeak stacks descend in alternating colors and allow empty targets", () => {
  assert.equal(cardPlacementIsValid(two, "A", "H", false), true);
  assert.equal(cardPlacementIsValid(three, "2", "D", false), false);
  assert.equal(cardPlacementIsValid(null, "K", "S", false), true);
});

void test("malformed card values and suits are never legal, including empty piles", () => {
  for (const forBoard of [true, false]) {
    assert.equal(cardPlacementIsValid(null, "invalid", "H", forBoard), false);
    assert.equal(cardPlacementIsValid(null, "A", "invalid", forBoard), false);
  }
});

void test("a valid hand-to-board move consumes only the top hand card", () => {
  const f = fixture();
  f.player.hand = [two, ace];
  f.player.deck = [three];
  assert.equal(
    handToBoard({ ...f, card: ace, boardEndLocation: { row: 0, col: 0 } }),
    true,
  );
  assert.deepEqual(f.player.hand, [two]);
  assert.deepEqual(f.player.deck, [three]);
  assert.deepEqual(f.board[0]![0], ace);
});

void test("forged, stale, and duplicate hand moves cannot consume a different card", () => {
  const f = fixture();
  f.player.hand = [ace, two];
  assert.equal(
    handToBoard({ ...f, card: ace, boardEndLocation: { row: 0, col: 0 } }),
    false,
  );
  assert.deepEqual(f.player.hand, [ace, two]);
  f.player.hand = [ace];
  handToBoard({ ...f, card: ace, boardEndLocation: { row: 0, col: 0 } });
  assert.equal(
    handToBoard({ ...f, card: ace, boardEndLocation: { row: 0, col: 1 } }),
    false,
  );
  assert.equal(f.board[0]![1], null);
});

void test("hand-to-squeak moves validate both source and target before mutation", () => {
  const f = fixture();
  f.player.hand = [ace];
  f.player.squeakHand[0] = [three];
  assert.equal(
    handToSqueak({ ...f, card: ace, squeakStackEndIndex: 0 }),
    false,
  );
  assert.deepEqual(f.player.hand, [ace]);
  assert.equal(
    handToSqueak({ ...f, card: two, squeakStackEndIndex: 0 }),
    false,
  );
  f.player.squeakHand[0] = [two];
  handToSqueak({ ...f, card: ace, squeakStackEndIndex: 0 });
  assert.deepEqual(f.player.squeakHand[0], [two, ace]);
  assert.deepEqual(f.player.hand, []);
});

void test("only the exposed squeak card can move to the board", () => {
  const f = fixture();
  f.player.squeakHand[0] = [ace, two];
  assert.equal(
    squeakToBoard({
      ...f,
      card: ace,
      squeakStackStartIndex: 0,
      boardEndLocation: { row: 0, col: 0 },
    }),
    false,
  );
  assert.deepEqual(f.player.squeakHand[0], [ace, two]);
  assert.equal(f.board[0]![0], null);
});

void test("a missing source card must not splice the last card out of a squeak stack", () => {
  const f = fixture();
  f.player.squeakHand[0] = [three, two];
  assert.equal(
    squeakToSqueak({
      ...f,
      card: ace,
      squeakStackStartIndex: 0,
      squeakStackEndIndex: 1,
    }),
    false,
  );
  assert.deepEqual(f.player.squeakHand[0], [three, two]);
  assert.deepEqual(f.player.squeakHand[1], []);
});

void test("an empty squeak stack must refill before accepting moves while its deck has cards", () => {
  const f = fixture();
  f.player.hand = [ace];
  f.player.squeakHand[0] = [three, two];
  f.player.squeakDeck = [three];
  assert.equal(
    handToSqueak({ ...f, card: ace, squeakStackEndIndex: 1 }),
    false,
  );
  assert.equal(
    squeakToSqueak({
      ...f,
      card: two,
      squeakStackStartIndex: 0,
      squeakStackEndIndex: 1,
    }),
    false,
  );
  assert.deepEqual(f.player.hand, [ace]);
  assert.deepEqual(f.player.squeakHand[0], [three, two]);
});

void test("moving a squeak stack onto itself or an illegal target is denied", () => {
  const f = fixture();
  f.player.squeakHand[0] = [three, two];
  assert.equal(
    squeakToSqueak({
      ...f,
      card: two,
      squeakStackStartIndex: 0,
      squeakStackEndIndex: 0,
    }),
    false,
  );
  f.player.squeakHand[1] = [ace];
  assert.equal(
    squeakToSqueak({
      ...f,
      card: two,
      squeakStackStartIndex: 0,
      squeakStackEndIndex: 1,
    }),
    false,
  );
  assert.deepEqual(f.player.squeakHand[0], [three, two]);
});

void test("a valid squeak move carries the selected card and its descendants", () => {
  const f = fixture();
  const four = { value: "4", suit: "C" };
  f.player.squeakHand[0] = [four, three, two];
  f.player.squeakHand[1] = [four];
  squeakToSqueak({
    ...f,
    card: three,
    squeakStackStartIndex: 0,
    squeakStackEndIndex: 1,
  });
  assert.deepEqual(f.player.squeakHand[0], [four]);
  assert.deepEqual(f.player.squeakHand[1], [four, three, two]);
});

void test("invalid or already occupied draw targets do not discard cards", () => {
  const f = fixture();
  f.player.squeakDeck = [ace, two];
  f.player.deck = [three];
  drawFromSqueakDeck({ ...f, indexToDrawTo: 9 });
  drawInitialSqueakStackCardFromDeck({ ...f, indexToDrawTo: 9 });
  assert.deepEqual(f.player.squeakDeck, [ace, two]);
  assert.deepEqual(f.player.deck, [three]);
  drawFromSqueakDeck({ ...f, indexToDrawTo: 0 });
  drawFromSqueakDeck({ ...f, indexToDrawTo: 0 });
  drawInitialSqueakStackCardFromDeck({ ...f, indexToDrawTo: 0 });
  assert.deepEqual(f.player.squeakDeck, [ace]);
  assert.deepEqual(f.player.squeakHand[0], [two]);
  assert.deepEqual(f.player.deck, [three]);
});

void test("deck draws preserve physical pile order through recycling", () => {
  const f = fixture();
  f.player.deck = [ace, two, three];
  drawFromDeck(f);
  assert.deepEqual(f.player.hand, [three, two, ace]);
  drawFromDeck(f);
  assert.deepEqual(f.player.deck, [ace, two, three]);
  assert.deepEqual(f.player.hand, []);
});

void test("a completed king pile clears only in its original round", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  const king = { value: "K", suit: "H" };
  f.player.hand = [king];
  f.board[0]![0] = { value: "Q", suit: "H" };
  handToBoard({ ...f, card: king, boardEndLocation: { row: 0, col: 0 } });
  const nextBoard = Array.from({ length: 4 }, () =>
    Array<ICard | null>(5).fill(ace),
  );
  f.gameData.TEST!.board = nextBoard;
  t.mock.timers.tick(700);
  assert.deepEqual(nextBoard[0]![0], ace);
});

void test("king cleanup and automatic squeak refills still work within the round", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  const king = { value: "K", suit: "H" };
  f.player.squeakHand[0] = [king];
  f.player.squeakDeck = [two];
  f.board[0]![0] = { value: "Q", suit: "H" };
  squeakToBoard({
    ...f,
    card: king,
    squeakStackStartIndex: 0,
    boardEndLocation: { row: 0, col: 0 },
  });
  t.mock.timers.tick(500);
  assert.deepEqual(f.player.squeakHand[0], [two]);
  t.mock.timers.tick(200);
  assert.equal(f.board[0]![0], null);
});

void test("delayed game work is ignored after deletion, replacement, or reset", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  for (const change of ["delete", "replace", "reset"] as const) {
    const f = fixture();
    let called = false;
    scheduleRoundTask(
      f.gameData,
      f.roomCode,
      () => {
        called = true;
      },
      100,
    );
    if (change === "delete") delete f.gameData.TEST;
    if (change === "replace") f.gameData.TEST = { ...f.gameData.TEST! };
    if (change === "reset") f.gameData.TEST!.currentRound++;
    t.mock.timers.tick(100);
    assert.equal(called, false, change);
  }
});

void test("scoring counts played cards across all remaining piles without shuffling", () => {
  const deck = createDeck();
  const played = deck.splice(0, 3);
  const remainingBefore = structuredClone(deck);
  assert.deepEqual(
    calculateCardsPlayedDuringRound(
      deck.slice(0, 13),
      deck.slice(13, 26),
      deck.slice(26),
    ),
    played,
  );
  assert.deepEqual(deck, remainingBefore);
  assert.equal(calculateCardsPlayedDuringRound(createDeck()).length, 0);
  assert.equal(calculateCardsPlayedDuringRound().length, 52);
});

void test("socket draw and move events reject another player's identity and frozen rounds", () => {
  const f = fixture();
  f.player.deck = [ace, two, three];
  f.player.hand = [ace];
  const handlers = new Map<string, (data: unknown) => void>();
  const socket = {
    rooms: new Set([f.roomCode]),
    data: { playerID: "other" },
    on: (event: string, handler: (data: unknown) => void) =>
      handlers.set(event, handler),
  } as unknown as PlayerSocket;
  drawFromDeckHandler(f.io, socket, f.gameData, f.miscRoomData);
  proposedCardDropHandler(f.io, socket, f.gameData, f.miscRoomData);
  const proposal = {
    playerID: f.playerID,
    roomCode: f.roomCode,
    card: ace,
    handStart: true,
    boardEndLocation: { row: 0, col: 0 },
  };
  for (const frozen of [false, true]) {
    socket.data.playerID = frozen ? f.playerID : "other";
    f.miscRoomData.TEST!.preventOtherPlayersFromSqueaking = frozen;
    handlers.get("playerDrawFromDeck")!(proposal);
    handlers.get("proposedCardDrop")!(proposal);
    assert.equal(f.player.deck.length, 3);
    assert.deepEqual(f.player.hand, [ace]);
    assert.equal(f.board[0]![0], null);
  }
});
