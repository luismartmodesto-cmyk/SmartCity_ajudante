export function buyAndPlaceBuilding({ balance, building, lots, lotId }) {
  if (!Number.isSafeInteger(balance) || balance < 0) {
    return { success: false, reason: "invalid-balance" };
  }

  if (
    !building
    || typeof building.id !== "string"
    || !Number.isSafeInteger(building.price)
    || building.price < 0
  ) {
    return { success: false, reason: "invalid-building" };
  }

  if (!Array.isArray(lots)) {
    return { success: false, reason: "invalid-lots" };
  }

  const lot = lots.find((candidate) => candidate.id === lotId);
  if (!lot) {
    return { success: false, reason: "invalid-lot" };
  }

  if (lot.buildingId) {
    return { success: false, reason: "occupied-lot" };
  }

  if (balance < building.price) {
    return { success: false, reason: "insufficient-funds" };
  }

  return {
    success: true,
    balance: balance - building.price,
    lots: lots.map((candidate) => (
      candidate.id === lotId
        ? { ...candidate, buildingId: building.id }
        : candidate
    )),
  };
}

export function removeBuilding({
  balance,
  building,
  lots,
  lotId,
  refundRate,
  coinLimit,
}) {
  if (!Number.isSafeInteger(balance) || balance < 0) {
    return { success: false, reason: "invalid-balance" };
  }

  if (
    !building
    || typeof building.id !== "string"
    || !Number.isSafeInteger(building.price)
    || building.price < 0
    || typeof refundRate !== "number"
    || !Number.isFinite(refundRate)
    || refundRate < 0
    || refundRate > 1
  ) {
    return { success: false, reason: "invalid-building" };
  }

  if (!Array.isArray(lots)) {
    return { success: false, reason: "invalid-lots" };
  }

  const lot = lots.find((candidate) => candidate.id === lotId);
  if (!lot) {
    return { success: false, reason: "invalid-lot" };
  }

  if (lot.buildingId !== building.id) {
    return { success: false, reason: "building-mismatch" };
  }

  const refund = Math.floor(building.price * refundRate);
  if (
    !Number.isSafeInteger(refund)
    || !Number.isSafeInteger(coinLimit)
    || coinLimit < 0
  ) {
    return { success: false, reason: "invalid-building" };
  }

  const nextBalance = Math.min(balance + refund, coinLimit);
  if (!Number.isSafeInteger(nextBalance) || nextBalance < balance) {
    return { success: false, reason: "invalid-balance" };
  }

  return {
    success: true,
    balance: nextBalance,
    refunded: nextBalance - balance,
    lots: lots.map((candidate) => (
      candidate.id === lotId
        ? { ...candidate, buildingId: null }
        : candidate
    )),
  };
}
