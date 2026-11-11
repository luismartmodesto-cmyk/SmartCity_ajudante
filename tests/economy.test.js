import assert from "node:assert/strict";
import test from "node:test";
import {
  addCoins,
  collectStoreIncome,
  getLocalDateKey,
  isRecoveryAvailable,
} from "../src/js/systems/economy.js";

test("adds coins without exceeding the configured limit", () => {
  assert.deepEqual(
    addCoins({ balance: 490, amount: 20, coinLimit: 500 }),
    { success: true, balance: 500, added: 10 },
  );
});

test("rejects invalid coin values", () => {
  assert.deepEqual(
    addCoins({ balance: -1, amount: 10, coinLimit: 500 }),
    { success: false, reason: "invalid-economy-value" },
  );
  assert.deepEqual(
    addCoins({ balance: 100, amount: -1, coinLimit: 500 }),
    { success: false, reason: "invalid-economy-value" },
  );
});

test("calculates store income and respects the coin limit", () => {
  assert.deepEqual(
    collectStoreIncome({
      balance: 10,
      storeCount: 2,
      coinsPerStore: 2,
      coinLimit: 500,
    }),
    { success: true, balance: 14, added: 4 },
  );
  assert.deepEqual(
    collectStoreIncome({
      balance: 499,
      storeCount: 2,
      coinsPerStore: 2,
      coinLimit: 500,
    }),
    { success: true, balance: 500, added: 1 },
  );
});

test("makes recovery available only below the cheapest building price and once per day", () => {
  const options = {
    balance: 14,
    minimumBuildingPrice: 15,
    lastRecoveryDate: null,
    today: "2026-11-07",
  };
  assert.equal(isRecoveryAvailable(options), true);
  assert.equal(isRecoveryAvailable({ ...options, balance: 15 }), false);
  assert.equal(
    isRecoveryAvailable({ ...options, lastRecoveryDate: "2026-11-07" }),
    false,
  );
});

test("formats a local calendar date without converting time zones", () => {
  assert.equal(getLocalDateKey(new Date(2026, 10, 7)), "2026-11-07");
});
