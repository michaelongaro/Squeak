import type { ICard } from "../src/utils/generateDeckAndSqueakCards";
import assert from "node:assert/strict";
import test from "node:test";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Server } from "socket.io";
import type {
  IGameData,
  IMiscRoomData,
  IRoomData,
  PlayerSocket,
} from "../src/types/socket";
import { createDeck } from "../src/utils/generateDeckAndSqueakCards";

// Never load real credentials or connect to the project database in these tests.
process.env.SKIP_ENV_VALIDATION = "1";
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/test";
process.env.CRON_JOB_SECRET = "test-only-secret";
const unexpectedQuery = () => {
  throw new Error("Unexpected database call in test");
};
Object.assign(globalThis, {
  prisma: {
    room: { update: unexpectedQuery, findMany: unexpectedQuery },
    stats: { findUnique: unexpectedQuery, update: unexpectedQuery },
    user: { upsert: unexpectedQuery },
    analytics: { upsert: async () => ({}) },
  },
});
const { prisma } = await import("../src/server/db");
const { castVoteHandler } =
  await import("../src/server/socket/handlers/castVoteHandler");
const { joinRoomHandler } =
  await import("../src/server/socket/handlers/joinRoomHandler");
const { leaveRoom } =
  await import("../src/server/socket/handlers/leaveRoomHandler");
const { rejoinRoomHandler } =
  await import("../src/server/socket/handlers/rejoinRoomHandler");
const { resetGameHandler } =
  await import("../src/server/socket/handlers/resetGameHandler");
const { generateAndEmitScoreboard } =
  await import("../src/server/socket/handlers/roundOverHandler");
const { usersRouter } = await import("../src/server/api/routers/users");
const { default: cronHandler } = await import("../src/pages/api/cron");
const { socketState, removeRoomState } =
  await import("../src/server/socket/state");
const { recordAnalytics } = await import("../src/server/analytics");
const { startGameHandler } =
  await import("../src/server/socket/handlers/startGameHandler");
const { createRoomHandler } =
  await import("../src/server/socket/handlers/createRoomHandler");
const { default: pageViewHandler } =
  await import("../src/pages/api/analytics/page-view");

function fixture() {
  const player = {
    username: "Player",
    avatarPath: "/avatars/rabbit.svg",
    color: "red",
    cardBackVariant: "Standard",
    deckHueRotation: 0,
  };
  const roomData: IRoomData = {
    TEST: {
      roomConfig: {
        code: "TEST",
        hostUserID: "a",
        hostUsername: "Player",
        playersInRoom: 2,
        playerIDsInRoom: ["a", "b"],
        maxPlayers: 5,
        pointsToWin: 100,
        isPublic: false,
        gameStarted: true,
      },
      players: { a: { ...player }, b: { ...player } },
    },
  };
  const gameData: IGameData = {
    TEST: {
      board: Array.from({ length: 4 }, () => Array<ICard | null>(5).fill(null)),
      currentRound: 1,
      playerIDsThatLeftMidgame: [],
      players: Object.fromEntries(
        ["a", "b"].map((id) => [
          id,
          {
            deck: createDeck(),
            hand: [],
            squeakDeck: [],
            squeakHand: [[], [], [], []],
            totalPoints: 0,
            rankInRoom: 1,
          },
        ]),
      ),
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
  const events: string[] = [];
  const io = {
    in: () => ({ emit: (event: string) => events.push(event) }),
  } as unknown as Server;
  function socket(playerID: string) {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const value = {
      data: { playerID },
      rooms: new Set(["TEST"]),
      join: () => undefined,
      leave: () => undefined,
      emit: () => undefined,
      on: (event: string, callback: (...args: unknown[]) => unknown) =>
        handlers.set(event, callback),
    } as unknown as PlayerSocket;
    return {
      value,
      send: (event: string, ...args: unknown[]) =>
        handlers.get(event)!(...args),
    };
  }
  return { roomData, gameData, miscRoomData, io, events, socket };
}

void test("each player can vote only once and old vote timers cannot clear a later vote", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  const a = f.socket("a"),
    b = f.socket("b");
  for (const s of [a, b])
    castVoteHandler(f.io, s.value, f.gameData, f.miscRoomData, f.roomData);
  const vote = {
    roomCode: "TEST",
    voteType: "rotateDecks",
    voteDirection: "for",
  };
  a.send("castVote", vote);
  a.send("castVote", vote);
  assert.deepEqual(f.miscRoomData.TEST!.currentVotes, ["agree"]);
  t.mock.timers.tick(10000);
  b.send("castVote", vote);
  assert.ok(f.events.includes("decksWereRotated"));
  a.send("castVote", vote);
  t.mock.timers.tick(20000);
  assert.deepEqual(f.miscRoomData.TEST!.currentVotes, ["agree"]);
  t.mock.timers.tick(10000);
  assert.deepEqual(f.miscRoomData.TEST!.currentVotes, []);
});

void test("repeated joins do not consume another slot and started games reject new players", async () => {
  const f = fixture();
  f.roomData.TEST!.roomConfig.gameStarted = false;
  const a = f.socket("a");
  joinRoomHandler(f.io, a.value, f.roomData);
  await a.send("joinRoom", {
    code: "TEST",
    userID: "a",
    playerMetadata: f.roomData.TEST!.players.a,
  });
  assert.equal(f.roomData.TEST!.roomConfig.playersInRoom, 2);
  assert.deepEqual(f.roomData.TEST!.roomConfig.playerIDsInRoom, ["a", "b"]);
  f.roomData.TEST!.roomConfig.gameStarted = true;
  let response: unknown;
  await a.send(
    "joinRoom",
    { code: "TEST", userID: "new", playerMetadata: f.roomData.TEST!.players.a },
    (value: unknown) => {
      response = value;
    },
  );
  assert.equal(response, "gameStarted");
  assert.equal(f.roomData.TEST!.players.new, undefined);
});

void test("leaving twice midgame decrements room occupancy only once", async (t) => {
  t.mock.method(prisma.room, "update", async () => ({}));
  const f = fixture();
  const a = f.socket("a");
  const args = {
    ...f,
    socket: a.value,
    roomCode: "TEST",
    playerID: "a",
    playerWasKicked: false,
  };
  await leaveRoom(args);
  await leaveRoom(args);
  assert.equal(f.roomData.TEST!.roomConfig.playersInRoom, 1);
  assert.deepEqual(f.gameData.TEST!.playerIDsThatLeftMidgame, ["a"]);
  assert.equal(f.roomData.TEST!.roomConfig.hostUserID, "b");
});

void test("a midgame rejoin persists restored occupancy and is idempotent", async (t) => {
  const update = t.mock.method(prisma.room, "update", async () => ({}));
  const f = fixture();
  f.gameData.TEST!.playerIDsThatLeftMidgame = ["a"];
  f.roomData.TEST!.roomConfig.playerIDsInRoom = ["b"];
  f.roomData.TEST!.roomConfig.playersInRoom = 1;
  const a = f.socket("a");
  rejoinRoomHandler(f.io, a.value, f.gameData, f.roomData, f.miscRoomData);
  await a.send("rejoinRoom", { code: "TEST", userID: "a" });
  await a.send("rejoinRoom", { code: "TEST", userID: "a" });
  assert.equal(update.mock.callCount(), 1);
  assert.equal(f.roomData.TEST!.roomConfig.playersInRoom, 2);
  assert.deepEqual(f.gameData.TEST!.playerIDsThatLeftMidgame, []);
});

void test("returning to the lobby does not deduct departed players a second time", async (t) => {
  t.mock.method(prisma.room, "update", async () => ({}));
  const f = fixture();
  f.gameData.TEST!.playerIDsThatLeftMidgame = ["b"];
  f.roomData.TEST!.roomConfig.playersInRoom = 1;
  f.roomData.TEST!.roomConfig.playerIDsInRoom = ["a"];
  f.miscRoomData.TEST!.scoreboardMetadata = {
    gameWinnerID: "a",
    roundWinnerID: "a",
    playerRoundDetails: {},
  };
  const a = f.socket("a");
  resetGameHandler(f.io, a.value, f.gameData, f.roomData, f.miscRoomData);
  await a.send("resetGame", { gameIsFinished: true, roomCode: "TEST" });
  assert.equal(f.roomData.TEST!.roomConfig.playersInRoom, 1);
  assert.deepEqual(Object.keys(f.roomData.TEST!.players), ["a"]);
  assert.equal(f.roomData.TEST!.roomConfig.gameStarted, false);
});

void test("Squeak stats credit the button presser even when another player scores higher", async (t) => {
  t.mock.method(
    prisma.stats,
    "findUnique",
    async ({ where }: { where: { userID: string } }) => ({
      id: where.userID,
      squeaks: 0,
      allFinishedPlacesValues: [],
      allLeftInSqueakValues: [],
      averageFinishingPlace: 0,
      averageLeftInSqueak: 0,
      highestScore: 0,
      totalGamesPlayed: 0,
      totalRoundsPlayed: 0,
    }),
  );
  const update = t.mock.method(prisma.stats, "update", async () => ({}));
  const f = fixture();
  f.gameData.TEST!.players.b!.deck = [];
  f.gameData.TEST!.players.b!.squeakDeck = [{ value: "A", suit: "H" }];
  const result = generateAndEmitScoreboard({
    ...f,
    roomCode: "TEST",
    playerWhoSqueakedID: "a",
  });
  assert.equal(result?.roundWinnerID, "b");
  await new Promise<void>((resolve) => setImmediate(resolve));
  const calls = update.mock.calls as unknown as {
    arguments: [{ where: { id: string }; data: { squeaks: number } }];
  }[];
  assert.equal(
    calls.find((call) => call.arguments[0].where.id === "a")?.arguments[0].data
      .squeaks,
    1,
  );
  assert.equal(
    calls.find((call) => call.arguments[0].where.id === "b")?.arguments[0].data
      .squeaks,
    0,
  );
});

void test("roundOver ignores premature Squeaks without freezing the round", () => {
  const f = fixture();
  f.gameData.TEST!.players.a!.squeakDeck = [{ value: "A", suit: "H" }];
  assert.equal(
    generateAndEmitScoreboard({
      ...f,
      roomCode: "TEST",
      playerWhoSqueakedID: "a",
    }),
    undefined,
  );
  assert.equal(f.miscRoomData.TEST!.preventOtherPlayersFromSqueaking, false);
});

void test("account creation rejects a different user and safely upserts the authenticated user", async (t) => {
  const upsert = t.mock.method(prisma.user, "upsert", async () => ({}));
  const caller = usersRouter.createCaller({
    auth: { userId: "a" },
    prisma,
  } as unknown as Parameters<typeof usersRouter.createCaller>[0]);
  await assert.rejects(
    caller.create("b"),
    (error: unknown) => error instanceof Error && error.message === "FORBIDDEN",
  );
  assert.equal(upsert.mock.callCount(), 0);
  assert.equal(await caller.create("a"), true);
  assert.equal(await caller.create("a"), true);
  assert.equal(upsert.mock.callCount(), 2);
});

void test("cron rejects unauthorized callers without exposing its secret or touching the database", async (t) => {
  const query = t.mock.method(prisma.room, "findMany", async () => []);
  let status: unknown, body: unknown;
  const res = {
    setHeader: () => undefined,
    status(code: number) {
      status = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as unknown as NextApiResponse;
  await cronHandler(
    { method: "POST", body: { secret: "bad-secret" } } as NextApiRequest,
    res,
  );
  assert.equal(status, 401);
  assert.equal(JSON.stringify(body).includes("test-only-secret"), false);
  assert.equal(JSON.stringify(body).includes("bad-secret"), false);
  assert.equal(query.mock.callCount(), 0);
  await cronHandler({ method: "GET" } as NextApiRequest, res);
  assert.equal(status, 405);
});

void test("room cleanup stops bots and removes every in-memory room record", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const f = fixture();
  let ticks = 0;
  f.miscRoomData.TEST!.botIntervals.push(setInterval(() => ticks++, 100));
  Object.assign(socketState.roomData, f.roomData);
  Object.assign(socketState.gameData, f.gameData);
  Object.assign(socketState.miscRoomData, f.miscRoomData);
  removeRoomState("TEST");
  t.mock.timers.tick(1000);
  assert.equal(ticks, 0);
  assert.equal(socketState.roomData.TEST, undefined);
  assert.equal(socketState.gameData.TEST, undefined);
  assert.equal(socketState.miscRoomData.TEST, undefined);
});

void test("analytics use UTC dates and atomic increments across concurrent events", async (t) => {
  const writes: unknown[] = [];
  t.mock.method(prisma.analytics, "upsert", async (args: unknown) => {
    writes.push(args);
    return {};
  });
  const now = new Date("2026-11-10T23:30:00-06:00");
  await Promise.all([
    recordAnalytics({ pageViews: 1 }, now),
    recordAnalytics({ gamesStarted: 1, roundsStarted: 1 }, now),
  ]);
  assert.deepEqual(writes[0], {
    where: { date: new Date("2026-11-11T00:00:00Z") },
    create: {
      date: new Date("2026-11-11T00:00:00Z"),
      pageViews: 1,
      roomsCreated: 0,
      gamesStarted: 0,
      gamesPlayed: 0,
      roundsStarted: 0,
      roundsPlayed: 0,
    },
    update: { pageViews: { increment: 1 } },
  });
  assert.deepEqual((writes[1] as { update: unknown }).update, {
    gamesStarted: { increment: 1 },
    roundsStarted: { increment: 1 },
  });
  await recordAnalytics({});
  assert.equal(writes.length, 2);
});

void test("page-view endpoint accepts only POSTs and cannot increment game metrics", async (t) => {
  const writes: unknown[] = [];
  t.mock.method(prisma.analytics, "upsert", async (args: unknown) => {
    writes.push(args);
    return {};
  });
  let status: number | undefined;
  const res = {
    setHeader: () => undefined,
    status(code: number) {
      status = code;
      return this;
    },
    end() {
      return this;
    },
  } as unknown as NextApiResponse;
  await pageViewHandler({ method: "GET", headers: {} } as NextApiRequest, res);
  assert.equal(status, 405);
  await pageViewHandler(
    {
      method: "POST",
      headers: { "sec-fetch-site": "cross-site" },
    } as NextApiRequest,
    res,
  );
  assert.equal(status, 403);
  assert.equal(writes.length, 0);
  await pageViewHandler(
    {
      method: "POST",
      headers: {},
      body: { gamesPlayed: 100 },
    } as NextApiRequest,
    res,
  );
  assert.equal(status, 204);
  assert.deepEqual((writes[0] as { update: unknown }).update, {
    pageViews: { increment: 1 },
  });
});

void test("game starts and subsequent rounds count once despite duplicate start events", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(prisma.room, "update", async () => ({}));
  const writes: unknown[] = [];
  t.mock.method(prisma.analytics, "upsert", async (args: unknown) => {
    writes.push(args);
    return {};
  });
  const f = fixture();
  f.roomData.TEST!.roomConfig.gameStarted = false;
  const a = f.socket("a");
  startGameHandler(f.io, a.value, f.roomData, f.gameData, f.miscRoomData);
  await a.send("startGame", { roomCode: "TEST", firstRound: true });
  await a.send("startGame", { roomCode: "TEST", firstRound: true });
  assert.equal(writes.length, 1);
  assert.deepEqual((writes[0] as { update: unknown }).update, {
    gamesStarted: { increment: 1 },
    roundsStarted: { increment: 1 },
  });
  f.miscRoomData.TEST!.roundStarted = false;
  await a.send("startGame", { roomCode: "TEST", firstRound: false });
  assert.deepEqual((writes[1] as { update: unknown }).update, {
    roundsStarted: { increment: 1 },
  });
});

void test("completed rounds count once and gamesPlayed requires a match winner", (t) => {
  t.mock.method(prisma.stats, "findUnique", async () => null);
  const writes: unknown[] = [];
  t.mock.method(prisma.analytics, "upsert", async (args: unknown) => {
    writes.push(args);
    return {};
  });
  const f = fixture();
  generateAndEmitScoreboard({
    ...f,
    roomCode: "TEST",
    playerWhoSqueakedID: "a",
  });
  generateAndEmitScoreboard({
    ...f,
    roomCode: "TEST",
    playerWhoSqueakedID: "a",
  });
  assert.equal(writes.length, 1);
  assert.deepEqual((writes[0] as { update: unknown }).update, {
    roundsPlayed: { increment: 1 },
  });
  const finished = fixture();
  finished.roomData.TEST!.roomConfig.pointsToWin = 10;
  generateAndEmitScoreboard({
    ...finished,
    roomCode: "TEST",
    playerWhoSqueakedID: "a",
  });
  assert.deepEqual((writes[1] as { update: unknown }).update, {
    gamesPlayed: { increment: 1 },
    roundsPlayed: { increment: 1 },
  });
});

void test("rooms are counted only after the room database write succeeds", async (t) => {
  const writes: unknown[] = [];
  // Prisma model delegates are mocked for the whole suite; add the create method here.
  Object.assign(prisma.room, { create: async () => ({}) });
  t.mock.method(prisma.analytics, "upsert", async (args: unknown) => {
    writes.push(args);
    return {};
  });
  const f = fixture();
  const a = f.socket("a");
  createRoomHandler(f.io, a.value, f.roomData, f.miscRoomData);
  await a.send(
    "createRoom",
    f.roomData.TEST!.roomConfig,
    f.roomData.TEST!.players.a,
  );
  assert.deepEqual((writes[0] as { update: unknown }).update, {
    roomsCreated: { increment: 1 },
  });
  t.mock.method(prisma.room, "create", async () => {
    throw new Error("Database unavailable");
  });
  await assert.rejects(async () =>
    a.send(
      "createRoom",
      f.roomData.TEST!.roomConfig,
      f.roomData.TEST!.players.a,
    ),
  );
  assert.equal(writes.length, 1);
});

void test("analytics failures are contained without preventing a scoreboard", async (t) => {
  t.mock.method(console, "error", () => undefined);
  t.mock.method(prisma.analytics, "upsert", async () => {
    throw new Error("Analytics unavailable");
  });
  t.mock.method(prisma.stats, "findUnique", async () => null);
  assert.equal(await recordAnalytics({ pageViews: 1 }), false);
  const f = fixture();
  assert.ok(
    generateAndEmitScoreboard({
      ...f,
      roomCode: "TEST",
      playerWhoSqueakedID: "a",
    }),
  );
  assert.ok(f.events.includes("scoreboardMetadata"));
  await new Promise<void>((resolve) => setImmediate(resolve));
});
