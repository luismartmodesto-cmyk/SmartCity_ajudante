export function addCoins({ balance, amount, coinLimit }) {
  if (
    !Number.isSafeInteger(balance)
    || balance < 0
    || !Number.isSafeInteger(amount)
    || amount < 0
    || !Number.isSafeInteger(coinLimit)
    || coinLimit < 0
    || balance > coinLimit
    || !Number.isSafeInteger(balance + amount)
  ) {
    return { success: false, reason: "invalid-economy-value" };
  }

  const nextBalance = Math.min(balance + amount, coinLimit);
  return {
    success: true,
    balance: nextBalance,
    added: nextBalance - balance,
  };
}

export function collectStoreIncome({
  balance,
  storeCount,
  coinsPerStore,
  coinLimit,
}) {
  if (
    !Number.isSafeInteger(storeCount)
    || storeCount < 0
    || !Number.isSafeInteger(coinsPerStore)
    || coinsPerStore < 0
    || !Number.isSafeInteger(storeCount * coinsPerStore)
  ) {
    return { success: false, reason: "invalid-income-value" };
  }

  return addCoins({
    balance,
    amount: storeCount * coinsPerStore,
    coinLimit,
  });
}

export function isRecoveryAvailable({
  balance,
  minimumBuildingPrice,
  lastRecoveryDate,
  today,
}) {
  return (
    Number.isSafeInteger(balance)
    && balance >= 0
    && Number.isSafeInteger(minimumBuildingPrice)
    && minimumBuildingPrice >= 0
    && typeof today === "string"
    && balance < minimumBuildingPrice
    && lastRecoveryDate !== today
  );
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
