import assert from "node:assert/strict";
import test from "node:test";
import { loadGame, SAVE_KEY, saveGame } from "../src/js/systems/saveSystem.js";

const COIN_LIMIT = 500;

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function createState() {
  const lots = Array.from({ length: 36 }, (_, index) => ({
    id: index + 1,
    buildingId: null,
  }));
  lots[4].buildingId = "store";

  return {
    balance: 55,
    lots,
    lastRecoveryDate: "2026-11-07",
    xp: 30,
    rewardedActivityIds: ["vocabulary-dog"],
    audioEnabled: false,
  };
}

test("saves and restores game progress, rewards, and audio preference", () => {
  const storage = createStorage();
  const state = createState();

  saveGame(state, storage, COIN_LIMIT);

  assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).version, 2);
  assert.deepEqual(loadGame(storage, COIN_LIMIT), state);
});

test("loads version 1 saves with defaults for newly added progress", () => {
  const storage = createStorage();
  const state = createState();
  delete state.xp;
  delete state.rewardedActivityIds;
  delete state.audioEnabled;
  storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, ...state }));

  assert.deepEqual(loadGame(storage, COIN_LIMIT), {
    ...state,
    xp: 0,
    rewardedActivityIds: [],
    audioEnabled: true,
  });
});

test("returns null when no saved game exists", () => {
  assert.equal(loadGame(createStorage(), COIN_LIMIT), null);
});

test("reports corrupt or incompatible saved data", () => {
  const storage = createStorage();
  storage.setItem(SAVE_KEY, "{not-json");
  assert.throws(() => loadGame(storage, COIN_LIMIT), /JSON inválidos/);

  storage.setItem(SAVE_KEY, JSON.stringify({ version: 3 }));
  assert.throws(() => loadGame(storage, COIN_LIMIT), /inválido ou usa uma versão incompatível/);
});

test("refuses to save invalid game data", () => {
  const storage = createStorage();
  const state = createState();
  state.balance = -1;

  assert.throws(() => saveGame(state, storage, COIN_LIMIT), /dados do jogo são inválidos/);
});

test("refuses invalid XP, duplicate reward IDs, and missing audio preference", () => {
  const storage = createStorage();
  const state = createState();

  assert.throws(
    () => saveGame({ ...state, xp: -1 }, storage, COIN_LIMIT),
    /dados do jogo são inválidos/,
  );
  assert.throws(
    () => saveGame({ ...state, rewardedActivityIds: ["same", "same"] }, storage, COIN_LIMIT),
    /dados do jogo são inválidos/,
  );
  assert.throws(
    () => saveGame({ ...state, audioEnabled: undefined }, storage, COIN_LIMIT),
    /dados do jogo são inválidos/,
  );
});
