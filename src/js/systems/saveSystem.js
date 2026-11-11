export const SAVE_KEY = "smartcity-save-v1";
const SAVE_VERSION = 2;
const LOT_COUNT = 36;

function isValidState(state, coinLimit, version = SAVE_VERSION) {
  return (
    state !== null
    && typeof state === "object"
    && Number.isSafeInteger(state.balance)
    && state.balance >= 0
    && state.balance <= coinLimit
    && Array.isArray(state.lots)
    && state.lots.length === LOT_COUNT
    && state.lots.every((lot, index) => (
      lot !== null
      && typeof lot === "object"
      && lot.id === index + 1
      && (lot.buildingId === null || typeof lot.buildingId === "string")
    ))
    && (
      state.lastRecoveryDate === null
      || (
        typeof state.lastRecoveryDate === "string"
        && /^\d{4}-\d{2}-\d{2}$/.test(state.lastRecoveryDate)
      )
    )
    && (
      version === 1
      || (
        Number.isSafeInteger(state.xp)
        && state.xp >= 0
        && Array.isArray(state.rewardedActivityIds)
        && state.rewardedActivityIds.every((id) => typeof id === "string")
        && new Set(state.rewardedActivityIds).size === state.rewardedActivityIds.length
        && typeof state.audioEnabled === "boolean"
      )
    )
  );
}

function requireStorage(storage) {
  if (
    !storage
    || typeof storage.getItem !== "function"
    || typeof storage.setItem !== "function"
  ) {
    throw new Error("O armazenamento local não está disponível.");
  }
}

export function saveGame(state, storage, coinLimit) {
  requireStorage(storage);

  if (!Number.isSafeInteger(coinLimit) || coinLimit < 0 || !isValidState(state, coinLimit)) {
    throw new Error("Os dados do jogo são inválidos e não foram salvos.");
  }

  const saveData = {
    version: SAVE_VERSION,
    balance: state.balance,
    lots: state.lots.map((lot) => ({
      id: lot.id,
      buildingId: lot.buildingId,
    })),
    lastRecoveryDate: state.lastRecoveryDate,
    xp: state.xp,
    rewardedActivityIds: [...state.rewardedActivityIds],
    audioEnabled: state.audioEnabled,
  };

  storage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

export function loadGame(storage, coinLimit) {
  requireStorage(storage);

  const serializedData = storage.getItem(SAVE_KEY);
  if (serializedData === null) return null;

  let saveData;
  try {
    saveData = JSON.parse(serializedData);
  } catch (error) {
    throw new Error("O salvamento local contém dados JSON inválidos.", { cause: error });
  }

  const version = saveData?.version;
  if (
    (version !== 1 && version !== SAVE_VERSION)
    || !Number.isSafeInteger(coinLimit)
    || coinLimit < 0
    || !isValidState(saveData, coinLimit, version)
  ) {
    throw new Error("O salvamento local está inválido ou usa uma versão incompatível.");
  }

  return {
    balance: saveData.balance,
    lots: saveData.lots.map((lot) => ({
      id: lot.id,
      buildingId: lot.buildingId,
    })),
    lastRecoveryDate: saveData.lastRecoveryDate,
    xp: version === 1 ? 0 : saveData.xp,
    rewardedActivityIds: version === 1 ? [] : [...saveData.rewardedActivityIds],
    audioEnabled: version === 1 ? true : saveData.audioEnabled,
  };
}
