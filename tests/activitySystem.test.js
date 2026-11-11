import assert from "node:assert/strict";
import test from "node:test";
import {
  checkAnswer,
  claimActivityReward,
} from "../src/js/systems/activitySystem.js";

const activity = {
  options: [
    { id: "apple", text: "Maçã" },
    { id: "bread", text: "Pão" },
  ],
  correctAnswerId: "apple",
};

test("recognizes the correct answer", () => {
  assert.deepEqual(checkAnswer(activity, "apple"), {
    success: true,
    correct: true,
  });
});

test("recognizes an incorrect answer without removing retry options", () => {
  assert.deepEqual(checkAnswer(activity, "bread"), {
    success: true,
    correct: false,
  });
  assert.equal(activity.options.length, 2);
});

test("rejects unknown answer IDs and invalid activities", () => {
  assert.deepEqual(checkAnswer(activity, "unknown"), {
    success: false,
    reason: "invalid-answer",
  });
  assert.deepEqual(checkAnswer({ options: [], correctAnswerId: "missing" }, "missing"), {
    success: false,
    reason: "invalid-activity",
  });
});

test("claims an activity reward only once", () => {
  const rewardActivity = {
    id: "vocabulary-apple",
    reward: { coins: 20, xp: 10 },
  };
  const firstClaim = claimActivityReward({
    activity: rewardActivity,
    balance: 100,
    xp: 0,
    rewardedActivityIds: [],
    coinLimit: 500,
  });

  assert.deepEqual(firstClaim, {
    success: true,
    rewarded: true,
    balance: 120,
    xp: 10,
    coinsAdded: 20,
    rewardedActivityIds: ["vocabulary-apple"],
  });

  assert.deepEqual(
    claimActivityReward({
      activity: rewardActivity,
      balance: firstClaim.balance,
      xp: firstClaim.xp,
      rewardedActivityIds: firstClaim.rewardedActivityIds,
      coinLimit: 500,
    }),
    {
      success: true,
      rewarded: false,
      balance: 120,
      xp: 10,
      coinsAdded: 0,
      rewardedActivityIds: ["vocabulary-apple"],
    },
  );
});

test("respects the coin cap and rejects invalid reward data", () => {
  assert.deepEqual(
    claimActivityReward({
      activity: { id: "vocabulary-apple", reward: { coins: 20, xp: 10 } },
      balance: 495,
      xp: 0,
      rewardedActivityIds: [],
      coinLimit: 500,
    }),
    {
      success: true,
      rewarded: true,
      balance: 500,
      xp: 10,
      coinsAdded: 5,
      rewardedActivityIds: ["vocabulary-apple"],
    },
  );
  assert.deepEqual(
    claimActivityReward({
      activity: { id: "vocabulary-apple", reward: { coins: -1, xp: 10 } },
      balance: 100,
      xp: 0,
      rewardedActivityIds: [],
      coinLimit: 500,
    }),
    { success: false, reason: "invalid-reward-data" },
  );
});
