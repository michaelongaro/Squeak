import assert from "node:assert/strict";
import test from "node:test";
import { createPageViewTracker } from "../src/utils/pageViewTracker";

void test("page views count initial loads and navigation, without duplicate route notifications", () => {
  let views = 0;
  const track = createPageViewTracker(() => views++);
  track("/");
  track("/");
  track("/?utm_source=test");
  track("/#tutorial");
  assert.equal(views, 1);
  track("/join");
  track("/join?room=TEST", { shallow: true });
  track("/game/TEST");
  track("/");
  assert.equal(views, 4);
});

void test("shallow navigation is ignored and a fresh page load counts again", () => {
  let views = 0;
  const record = () => views++;
  const track = createPageViewTracker(record);
  track("/game/TEST");
  track("/game/OTHER", { shallow: true });
  assert.equal(views, 1);
  createPageViewTracker(record)("/game/TEST");
  assert.equal(views, 2);
});
