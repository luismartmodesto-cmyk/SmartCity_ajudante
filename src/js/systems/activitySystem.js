import { addCoins } from "./economy.js";

export function checkAnswer(activity, answerId) {
  if (
    !activity
    || !Array.isArray(activity.options)
    || !activity.options.some((option) => option.id === activity.correctAnswerId)
  ) {
    return { success: false, reason: "invalid-activity" };
  }

  if (!activity.options.some((option) => option.id === answerId)) {
    return { success: false, reason: "invalid-answer" };
  }

  return {
    success: true,
    correct: answerId === activity.correctAnswerId,
  };
}

export function claimActivityReward({
  activity,
  balance,
  xp,
  rewardedActivityIds,
  coinLimit,
}) {
  if (
    !activity
    || typeof activity.id !== "string"
    || !activity.id
    || !activity.reward
    || !Number.isSafeInteger(activity.reward.coins)
    || activity.reward.coins < 0
    || !Number.isSafeInteger(activity.reward.xp)
    || activity.reward.xp < 0
    || !Number.isSafeInteger(balance)
    || balance < 0
    || !Number.isSafeInteger(coinLimit)
    || coinLimit < 0
    || balance > coinLimit
    || !Number.isSafeInteger(xp)
    || xp < 0
    || !Array.isArray(rewardedActivityIds)
    || rewardedActivityIds.some((id) => typeof id !== "string")
    || new Set(rewardedActivityIds).size !== rewardedActivityIds.length
  ) {
    return { success: false, reason: "invalid-reward-data" };
  }

  if (rewardedActivityIds.includes(activity.id)) {
    return {
      success: true,
      rewarded: false,
      balance,
      xp,
      coinsAdded: 0,
      rewardedActivityIds: [...rewardedActivityIds],
    };
  }

  const coinResult = addCoins({
    balance,
    amount: activity.reward.coins,
    coinLimit,
  });
  const nextXp = xp + activity.reward.xp;
  if (!coinResult.success || !Number.isSafeInteger(nextXp)) {
    return { success: false, reason: "invalid-reward-data" };
  }

  return {
    success: true,
    rewarded: true,
    balance: coinResult.balance,
    xp: nextXp,
    coinsAdded: coinResult.added,
    rewardedActivityIds: [...rewardedActivityIds, activity.id],
  };
}
