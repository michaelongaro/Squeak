# Squeak 🐁



https://github.com/user-attachments/assets/ca54aaa0-4d2e-4f10-a7a4-01644fa0544b



<br><br>
Visit the site and play for free: [Squeak](https://playsqueak.com/).

## Description

Squeak is a recreation of the card game popularly known as ["Nerts"](https://en.wikipedia.org/wiki/Nerts) made with the [T3 Stack](https://create.t3.gg/). This project relies heavily on [Socket.io](https://socket.io/) to handle all transmission of realtime game and friend logic. Authentication is handled by [Clerk](https://clerk.com/). The Postgres database and server are both hosted on [Railway](https://railway.app/).

Games can be played with 2-5 players and last roughly 20-40 minutes, depending on how many rounds there are. Sometime in the future I plan on creating native iOS and Android apps utilizing React Native with Expo.

## Development checks

- `npm test` runs regression tests for card moves, round timers, voting, room membership, scoring, and API guards. Database calls are mocked; tests do not use the project database.
- `npm run typecheck` generates Next.js route types and checks TypeScript.
- `npm run lint` runs ESLint directly (Next.js 16 removed `next lint`).
- `npm run build` generates the Prisma client and creates a production build with type checking enabled.

Socket handlers and helpers live under `src/server/socket`; only HTTP endpoints belong under `src/pages/api`. The room-cleanup job accepts a `POST` to `/api/cron` with `{ "secret": "<CRON_JOB_SECRET>" }` in its JSON body.

## Analytics

The `Analytics` table stores one row per UTC day, with atomic counters:

| Counter | Recorded when |
| --- | --- |
| `pageViews` | An initial page loads or navigation to a different path completes. Query-string, hash, shallow-route changes, and duplicate route notifications are ignored. Refreshes count again. |
| `roomsCreated` | A new room is successfully saved. |
| `gamesStarted` | The first round of a new match starts. |
| `gamesPlayed` | A match finishes with a player reaching the winning score. Abandoned matches are not included. |
| `roundsStarted` | Any round starts, including the first. |
| `roundsPlayed` | A round completes, including rounds ended by a vote. |

Each match/round counts once for the room, regardless of the number of human players or bots. Events are attributed to the UTC day on which they occur. Counters begin when this version is deployed; historical activity is not backfilled. Tracking is best effort: network or database failures can cause missed events, but never block gameplay. These are total page views, not unique visitors.

Before deploying to another environment, run `npm run db:analytics` against its configured `DATABASE_URL`. This rerunnable script only creates the analytics table; the existing `npm run db:push` workflow also includes the new model. Use Prisma Studio (`npm run db:studio`) to inspect daily counts. No user identifiers, IP addresses, cookies, or page URLs are stored, and game counters are recorded only by the server.

For all-time totals:

```sql
SELECT
  COALESCE(SUM("pageViews"), 0) AS "pageViews",
  COALESCE(SUM("roomsCreated"), 0) AS "roomsCreated",
  COALESCE(SUM("gamesStarted"), 0) AS "gamesStarted",
  COALESCE(SUM("gamesPlayed"), 0) AS "gamesPlayed",
  COALESCE(SUM("roundsStarted"), 0) AS "roundsStarted",
  COALESCE(SUM("roundsPlayed"), 0) AS "roundsPlayed"
FROM "Analytics";
```
