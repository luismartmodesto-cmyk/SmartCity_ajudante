import { gameConfig } from "./game/config.js";
import { buyAndPlaceBuilding, removeBuilding } from "./systems/buildingSystem.js";
import {
  addCoins,
  collectStoreIncome,
  getLocalDateKey,
  isRecoveryAvailable,
} from "./systems/economy.js";
import { checkAnswer, claimActivityReward } from "./systems/activitySystem.js";
import { speakText, stopSpeaking } from "./systems/audioSystem.js";
import { loadGame, saveGame, SAVE_KEY } from "./systems/saveSystem.js";
import {
  renderActivityFeedback,
  renderActivityPanel,
} from "./ui/activityPanel.js";
import { renderBuildingMenu } from "./ui/buildingMenu.js";

const game = document.querySelector("#game");
const brandImageUrl = new URL("../assets/images/ui/brand.jpg", import.meta.url).href;

let savedGame = null;
let persistenceError = null;
try {
  savedGame = loadGame(window.localStorage, gameConfig.economy.coinLimit);
} catch (error) {
  persistenceError = error;
  console.error("Não foi possível carregar o salvamento local.", error);
}

let persistenceEnabled = persistenceError === null;
let balance = savedGame?.balance ?? gameConfig.startingCoins;
let xp = savedGame?.xp ?? gameConfig.startingXp;
let rewardedActivityIds = savedGame?.rewardedActivityIds ?? [];
let audioEnabled = savedGame?.audioEnabled ?? true;
let buildingCatalog = [];
let activityCatalog = [];
let activityIndex = 0;
let selectedLotId = null;
let lots = savedGame?.lots ?? Array.from(
  { length: gameConfig.citySize * gameConfig.citySize },
  (_, index) => ({
  id: index + 1,
  buildingId: null,
  }),
);
let lastRecoveryDate = savedGame?.lastRecoveryDate ?? null;

game.innerHTML = `
  <div class="game-shell">
    <header class="topbar">
      <a class="brand-mark" href="./index.html" aria-label="Cidade e Inglês, início">
        <img src="${brandImageUrl}" alt="" />
      </a>
      <div class="brand-copy">
        <p class="eyebrow">APRENDER • CONSTRUIR • CRESCER</p>
        <h1>SmartCity</h1>
      </div>
      <div class="coin-counter" aria-label="Recursos do jogador">
        <span class="coin-icon" aria-hidden="true">✦</span>
        <div>
          <span class="coin-label">Suas moedas</span>
          <strong id="coin-balance">${balance}</strong>
          <span id="income-rate" class="coin-label">Renda: 0 moedas/min</span>
          <span class="coin-label">XP: <strong id="xp-balance">${xp}</strong></span>
        </div>
      </div>
    </header>

    <section class="welcome" aria-labelledby="welcome-title">
      <p class="eyebrow">SUA JORNADA COMEÇA AQUI</p>
      <h2 id="welcome-title">Um novo lugar para aprender e crescer.</h2>
      <p>Explore sua cidade. Cada terreno vazio é uma possibilidade.</p>
    </section>

    <div class="game-layout">
      <section class="city-card" aria-labelledby="city-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">MAPA DA CIDADE</p>
            <h2 id="city-title">Sua cidade</h2>
          </div>
          <span class="map-size">6 × 6</span>
        </div>
        <p class="city-instruction">Selecione um terreno para ver os detalhes.</p>
        <div id="city-grid" class="city-grid" aria-label="Terrenos da cidade"></div>
      </section>

      <aside class="details-card" aria-live="polite" aria-labelledby="details-title">
        <div class="detail-symbol" aria-hidden="true">⌖</div>
        <p class="eyebrow">TERRENO SELECIONADO</p>
        <h2 id="details-title">Nenhum terreno</h2>
        <p id="details-copy" class="details-copy">Escolha um dos terrenos no mapa para começar a explorar.</p>
        <div id="school-activity-entry" class="school-activity-entry" hidden>
          <button id="open-activity-button" class="open-activity-button" type="button" disabled>
            Abrir atividades de inglês
          </button>
          <p id="activity-load-message" class="activity-load-message" role="status"></p>
        </div>
        <div id="building-actions" class="building-actions" hidden>
          <button id="remove-building-button" class="building-remove-button" type="button">
            Remover construção
          </button>
          <p class="building-refund-note">Reembolso de 50% do preço, arredondado para baixo.</p>
        </div>
        <div id="building-options" class="building-options" aria-label="Construções disponíveis"></div>
        <p id="action-message" class="action-message" role="status"></p>
        <div id="recovery-panel" class="recovery-panel" hidden>
          <p id="recovery-message" class="details-copy" role="status"></p>
          <button id="recovery-button" class="recovery-button" type="button" hidden>
            Receber ${gameConfig.economy.recoveryCoins} moedas de recuperação
          </button>
        </div>
        <p id="save-message" class="save-message" role="status"></p>
        <div class="detail-note">
          <span class="note-dot" aria-hidden="true"></span>
          <p id="detail-note-copy">Selecione um terreno livre para ver as construções disponíveis.</p>
        </div>
      </aside>
    </div>

    <section id="activity-panel" class="activity-section" aria-label="Atividade de inglês" hidden></section>

    <section class="about-section" aria-labelledby="about-title">
      <h2 >Sobre nós</h2>
     <p>
       somos a eduTech e estamos desenvolvendo esses testes por que estamos preocupados com a ODS 4 (educação de qualidade ) no brasil.
        porque:
        por que a educação de qualidade é um direito fundamental e essencial para o desenvolvimento humano e social.
        e as nossas crianças não serão manipuladas por desinformação e nem por fake news.
     </p>
    </section>

    <footer class="page-footer">
      <p>Uma cidade feita de descobertas.</p>
      <button id="reset-game-button" class="reset-game-button" type="button">
        Reiniciar jogo
      </button>
    </footer>
  </div>
`;

const cityGrid = game.querySelector("#city-grid");
const detailsTitle = game.querySelector("#details-title");
const detailsCopy = game.querySelector("#details-copy");
const schoolActivityEntry = game.querySelector("#school-activity-entry");
const openActivityButton = game.querySelector("#open-activity-button");
const activityLoadMessage = game.querySelector("#activity-load-message");
const activityPanel = game.querySelector("#activity-panel");
const buildingActions = game.querySelector("#building-actions");
const removeBuildingButton = game.querySelector("#remove-building-button");
const buildingOptions = game.querySelector("#building-options");
const actionMessage = game.querySelector("#action-message");
const recoveryPanel = game.querySelector("#recovery-panel");
const recoveryButton = game.querySelector("#recovery-button");
const recoveryMessage = game.querySelector("#recovery-message");
const saveMessage = game.querySelector("#save-message");
const detailNoteCopy = game.querySelector("#detail-note-copy");
const coinBalance = game.querySelector("#coin-balance");
const coinCounter = game.querySelector(".coin-counter");
const incomeRate = game.querySelector("#income-rate");
const xpBalance = game.querySelector("#xp-balance");
const resetGameButton = game.querySelector("#reset-game-button");

resetGameButton.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Tem certeza de que deseja reiniciar o jogo? Todo o progresso salvo será apagado.",
  );
  if (!confirmed) return;

  try {
    window.localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  } catch (error) {
    console.error("Não foi possível reiniciar o jogo.", error);
    saveMessage.textContent = `Não foi possível reiniciar o jogo: ${error.message}`;
  }
});

for (const lot of lots) {
  const button = document.createElement("button");
  button.className = "city-lot";
  button.type = "button";
  button.dataset.lotId = String(lot.id);
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", `Terreno ${lot.id}, disponível`);

  const lotNumber = document.createElement("span");
  lotNumber.className = "lot-number";
  lotNumber.textContent = String(lot.id).padStart(2, "0");

  const buildingMark = document.createElement("span");
  buildingMark.className = "lot-building";
  buildingMark.setAttribute("aria-hidden", "true");

  const lotGround = document.createElement("span");
  lotGround.className = "lot-ground";
  lotGround.setAttribute("aria-hidden", "true");

  button.append(lotNumber, buildingMark, lotGround);
  cityGrid.append(button);
}

if (persistenceError) {
  saveMessage.textContent = `Não foi possível carregar o progresso salvo: ${persistenceError.message}`;
}

function persistGame(changes = {}) {
  if (!persistenceEnabled) return false;

  try {
    saveGame(
      {
        balance: changes.balance ?? balance,
        lots,
        lastRecoveryDate,
        xp: changes.xp ?? xp,
        rewardedActivityIds: changes.rewardedActivityIds ?? rewardedActivityIds,
        audioEnabled,
      },
      window.localStorage,
      gameConfig.economy.coinLimit,
    );
    return true;
  } catch (error) {
    persistenceEnabled = false;
    console.error("Não foi possível salvar o progresso local.", error);
    saveMessage.textContent = `Seu progresso não foi salvo: ${error.message}`;
    return false;
  }
}

function renderRecoveryOption() {
  if (buildingCatalog.length === 0) {
    recoveryPanel.hidden = true;
    recoveryButton.hidden = true;
    recoveryMessage.textContent = "";
    return;
  }

  const today = getLocalDateKey();
  const minimumBuildingPrice = Math.min(...buildingCatalog.map((building) => building.price));
  const available = isRecoveryAvailable({
    balance,
    minimumBuildingPrice,
    lastRecoveryDate,
    today,
  });

  recoveryButton.hidden = !available;
  const alreadyClaimed = balance < minimumBuildingPrice && lastRecoveryDate === today;
  recoveryPanel.hidden = !available && !alreadyClaimed;
  recoveryMessage.textContent = available
    ? `Seu saldo está abaixo de ${minimumBuildingPrice} moedas. Você pode usar esta ajuda uma vez por dia.`
    : alreadyClaimed
      ? "Você já usou sua recuperação de hoje. Tente novamente amanhã."
      : "";
}

function updateEconomyDisplay() {
  coinBalance.textContent = String(balance);
  xpBalance.textContent = String(xp);
  coinCounter.setAttribute("aria-label", `Saldo de moedas: ${balance}, XP: ${xp}`);

  const storeCount = lots.filter((lot) => lot.buildingId === "store").length;
  const incomePerMinute = storeCount * gameConfig.economy.storeIncomePerMinute;
  incomeRate.textContent = `Renda: ${incomePerMinute} ${incomePerMinute === 1 ? "moeda" : "moedas"}/min`;
  renderRecoveryOption();
}

function renderSelectedLot() {
  const lot = lots.find((candidate) => candidate.id === selectedLotId);
  if (!lot) {
    detailsTitle.textContent = "Nenhum terreno";
    detailsCopy.textContent = "Escolha um dos terrenos no mapa para começar a explorar.";
    detailNoteCopy.textContent = "Selecione um terreno livre para ver as construções disponíveis.";
    schoolActivityEntry.hidden = true;
    activityPanel.hidden = true;
    buildingActions.hidden = true;
    buildingOptions.replaceChildren();
    return;
  }

  const building = buildingCatalog.find((candidate) => candidate.id === lot.buildingId);
  detailsTitle.textContent = `Terreno ${String(lot.id).padStart(2, "0")}`;

  if (building) {
    detailsCopy.textContent = `${building.name}: ${building.description}`;
    schoolActivityEntry.hidden = building.id !== "school";
    buildingActions.hidden = false;
    removeBuildingButton.dataset.buildingId = building.id;
    removeBuildingButton.setAttribute(
      "aria-label",
      `Remover ${building.name} do terreno ${String(lot.id).padStart(2, "0")}`,
    );
    if (building.id !== "school") activityPanel.hidden = true;
    if (building.id === "school") {
      detailNoteCopy.textContent = "Abra as atividades de inglês nesta Escola.";
      openActivityButton.disabled = activityCatalog.length === 0;
    } else {
      detailNoteCopy.textContent = "A construção pode ser removida com reembolso parcial.";
    }
    buildingOptions.replaceChildren();
    return;
  }

  schoolActivityEntry.hidden = true;
  buildingActions.hidden = true;
  activityPanel.hidden = true;
  if (lot.buildingId) {
    detailsCopy.textContent = "Não foi possível identificar a construção deste terreno.";
    detailNoteCopy.textContent = "O terreno não pode ser alterado até que o salvamento seja corrigido.";
    buildingOptions.replaceChildren();
    return;
  }
  detailsCopy.textContent = "Escolha uma construção para comprar e posicionar neste terreno.";
  detailNoteCopy.textContent = "O custo será descontado do seu saldo assim que a construção for posicionada.";
  renderBuildingMenu(buildingOptions, buildingCatalog);
}

function updateLotButton(lot) {
  const button = cityGrid.querySelector(`[data-lot-id="${lot.id}"]`);
  const building = buildingCatalog.find((candidate) => candidate.id === lot.buildingId);
  const buildingMark = button.querySelector(".lot-building");

  button.classList.toggle("has-building", Boolean(building));
  button.setAttribute(
    "aria-label",
    building
      ? `Terreno ${lot.id}, ${building.name}`
      : `Terreno ${lot.id}, disponível`,
  );
  buildingMark.textContent = building?.symbol ?? "";
}

cityGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lot-id]");
  if (!button) return;

  if (!activityPanel.hidden) stopSpeaking();
  selectedLotId = Number(button.dataset.lotId);
  for (const lotButton of cityGrid.querySelectorAll("[data-lot-id]")) {
    const isSelected = lotButton === button;
    lotButton.classList.toggle("is-selected", isSelected);
    lotButton.setAttribute("aria-pressed", String(isSelected));
  }

  actionMessage.textContent = "";
  renderSelectedLot();
});

openActivityButton.addEventListener("click", () => {
  const selectedLot = lots.find((lot) => lot.id === selectedLotId);
  if (
    !selectedLot
    || selectedLot.buildingId !== "school"
    || activityCatalog.length === 0
  ) {
    return;
  }

  const activity = activityCatalog[activityIndex];
  renderActivityPanel(activityPanel, activity, {
    index: activityIndex,
    total: activityCatalog.length,
    audioEnabled,
  });
  activityPanel.hidden = false;
  activityPanel.querySelector(".activity-back-button").focus();
});

activityPanel.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-activity-action]");
  if (actionButton) {
    if (actionButton.dataset.activityAction === "back") {
      stopSpeaking();
      activityPanel.hidden = true;
      openActivityButton.focus();
      return;
    }

    if (actionButton.dataset.activityAction === "next") {
      activityIndex = (activityIndex + 1) % activityCatalog.length;
      const activity = activityCatalog[activityIndex];
      renderActivityPanel(activityPanel, activity, {
        index: activityIndex,
        total: activityCatalog.length,
        audioEnabled,
      });
      activityPanel.querySelector(".activity-next-button").focus();
      return;
    }

    if (actionButton.dataset.activityAction === "toggle-audio") {
      audioEnabled = !audioEnabled;
      if (!audioEnabled) stopSpeaking();
      const listenButton = activityPanel.querySelector("[data-activity-action='listen']");
      listenButton.disabled = !audioEnabled;
      actionButton.textContent = `Áudio: ${audioEnabled ? "ligado" : "desligado"}`;
      activityPanel.querySelector(".activity-audio-status").textContent = "";
      persistGame();
      return;
    }

    if (actionButton.dataset.activityAction === "listen") {
      const activity = activityCatalog[activityIndex];
      const played = speakText(activity.audioText);
      activityPanel.querySelector(".activity-audio-status").textContent = played
        ? ""
        : "Áudio não disponível neste navegador.";
      return;
    }

    return;
  }

  const answerButton = event.target.closest("[data-answer-id]");
  if (!answerButton || activityPanel.hidden) return;

  const activity = activityCatalog[activityIndex];
  const result = checkAnswer(activity, answerButton.dataset.answerId);
  if (!result.success) {
    console.error("Não foi possível validar a resposta da atividade.", result.reason);
    activityPanel.querySelector(".activity-feedback").textContent =
      "Não foi possível verificar essa resposta. Feche e abra a atividade novamente.";
    return;
  }

  if (!result.correct) {
    renderActivityFeedback(activityPanel, { correct: false, activity });
    return;
  }

  const rewardResult = claimActivityReward({
    activity,
    balance,
    xp,
    rewardedActivityIds,
    coinLimit: gameConfig.economy.coinLimit,
  });
  let message;
  if (!rewardResult.success) {
    console.error("Não foi possível aplicar a recompensa da atividade.", rewardResult);
    message = "Resposta correta, mas não foi possível aplicar a recompensa.";
  } else if (!rewardResult.rewarded) {
    message = "Muito bem! Você já recebeu a recompensa desta atividade.";
  } else {
    const saved = persistGame({
      balance: rewardResult.balance,
      xp: rewardResult.xp,
      rewardedActivityIds: rewardResult.rewardedActivityIds,
    });

    if (!saved) {
      message = "Resposta correta, mas a recompensa não foi aplicada porque não foi possível salvar o progresso.";
    } else {
      balance = rewardResult.balance;
      xp = rewardResult.xp;
      rewardedActivityIds = rewardResult.rewardedActivityIds;
      updateEconomyDisplay();
      message = `Muito bem! Recompensa: ${rewardResult.coinsAdded} moedas e ${activity.reward.xp} XP.`;
    }
  }

  for (const option of activityPanel.querySelectorAll("[data-answer-id]")) {
    option.disabled = true;
  }
  renderActivityFeedback(activityPanel, { correct: true, activity, message });
});

buildingOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-building-id]");
  if (!button) return;

  const building = buildingCatalog.find((candidate) => candidate.id === button.dataset.buildingId);
  const result = buyAndPlaceBuilding({
    balance,
    building,
    lots,
    lotId: selectedLotId,
  });

  if (!result.success) {
    const messages = {
      "invalid-balance": "Não foi possível concluir a compra: o saldo está inválido.",
      "invalid-building": "Não foi possível encontrar essa construção.",
      "invalid-lots": "Não foi possível carregar os terrenos da cidade.",
      "invalid-lot": "Selecione um terreno válido antes de construir.",
      "occupied-lot": "Este terreno já está ocupado. Escolha um terreno livre.",
      "insufficient-funds": `Saldo insuficiente. ${building.name} custa ${building.price} moedas.`,
    };
    actionMessage.textContent = messages[result.reason] ?? "Não foi possível concluir a compra.";
    return;
  }

  balance = result.balance;
  lots = result.lots;
  updateLotButton(lots.find((lot) => lot.id === selectedLotId));
  updateEconomyDisplay();
  persistGame();
  renderSelectedLot();
  actionMessage.textContent = `Compra concluída: ${building.name} agora ocupa o terreno ${String(selectedLotId).padStart(2, "0")}.`;
});

removeBuildingButton.addEventListener("click", () => {
  const lot = lots.find((candidate) => candidate.id === selectedLotId);
  const building = buildingCatalog.find(
    (candidate) => candidate.id === removeBuildingButton.dataset.buildingId,
  );
  if (!lot || !building || lot.buildingId !== building.id) {
    actionMessage.textContent = "Não foi possível identificar a construção para remover.";
    return;
  }

  const result = removeBuilding({
    balance,
    building,
    lots,
    lotId: selectedLotId,
    refundRate: gameConfig.buildingRemovalRefundRate,
    coinLimit: gameConfig.economy.coinLimit,
  });
  if (!result.success) {
    console.error("Não foi possível remover a construção.", result.reason);
    actionMessage.textContent = "Não foi possível remover esta construção. Confira o terreno e tente novamente.";
    return;
  }

  const refundPercent = Math.round(gameConfig.buildingRemovalRefundRate * 100);
  const refundMessage = result.refunded > 0
    ? `Você receberá ${result.refunded} moedas`
    : "Nenhuma moeda será acrescentada ao saldo";
  const confirmed = window.confirm(
    `Remover ${building.name} do terreno ${String(lot.id).padStart(2, "0")}? `
    + `${refundMessage} (${refundPercent}% do preço, arredondado para baixo).`,
  );
  if (!confirmed) return;

  balance = result.balance;
  lots = result.lots;
  if (!activityPanel.hidden) stopSpeaking();
  activityPanel.hidden = true;
  updateLotButton(lots.find((candidate) => candidate.id === selectedLotId));
  updateEconomyDisplay();
  persistGame();
  renderSelectedLot();
  actionMessage.textContent = result.refunded > 0
    ? `${building.name} removida. Você recebeu ${result.refunded} moedas.`
    : `${building.name} removida. Nenhuma moeda foi acrescentada ao saldo.`;
});

recoveryButton.addEventListener("click", () => {
  const today = getLocalDateKey();
  const minimumBuildingPrice = Math.min(...buildingCatalog.map((building) => building.price));
  if (!isRecoveryAvailable({
    balance,
    minimumBuildingPrice,
    lastRecoveryDate,
    today,
  })) {
    renderRecoveryOption();
    return;
  }

  const result = addCoins({
    balance,
    amount: gameConfig.economy.recoveryCoins,
    coinLimit: gameConfig.economy.coinLimit,
  });
  if (!result.success) {
    recoveryMessage.textContent = "Não foi possível aplicar a recuperação. Confira o saldo e tente novamente.";
    return;
  }

  balance = result.balance;
  lastRecoveryDate = today;
  updateEconomyDisplay();
  persistGame();
  recoveryMessage.textContent = `Você recebeu ${result.added} moedas. Já pode continuar construindo.`;
});

async function loadBuildingCatalog() {
  const response = await fetch(new URL("../data/buildings.json", import.meta.url));
  if (!response.ok) {
    throw new Error(`Falha ao carregar as construções: HTTP ${response.status}`);
  }

  const catalog = await response.json();
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error("O catálogo de construções está vazio ou inválido.");
  }

  return catalog;
}

async function loadActivityCatalog() {
  const response = await fetch(new URL("../data/questions.json", import.meta.url));
  if (!response.ok) {
    throw new Error(`Falha ao carregar as atividades: HTTP ${response.status}`);
  }

  const catalog = await response.json();
  if (!Array.isArray(catalog) || catalog.length !== 30) {
    throw new Error("O catálogo de atividades deve conter exatamente 30 atividades.");
  }

  const activityIds = new Set();
  for (const activity of catalog) {
    if (
      !activity
      || typeof activity.id !== "string"
      || activityIds.has(activity.id)
      || !["vocabulary", "daily-phrases", "dialogues"].includes(activity.category)
      || !["multiple-choice", "association", "dialogue-choice"].includes(activity.type)
      || activity.reviewStatus !== "draft"
      || typeof activity.prompt !== "string"
      || !activity.prompt
      || !Array.isArray(activity.options)
      || activity.options.length < 2
      || activity.options.some((option) => (
        !option
        || typeof option.id !== "string"
        || typeof option.text !== "string"
        || !option.text
      ))
      || typeof activity.hint !== "string"
      || !activity.hint
      || typeof activity.explanation !== "string"
      || !activity.explanation
      || typeof activity.audioText !== "string"
      || !activity.audioText
      || !activity.reward
      || !Number.isSafeInteger(activity.reward.coins)
      || activity.reward.coins < 0
      || !Number.isSafeInteger(activity.reward.xp)
      || activity.reward.xp < 0
      || !checkAnswer(activity, activity.correctAnswerId).success
      || (activity.type === "association" && (
        typeof activity.image !== "string"
        || !activity.image
        || typeof activity.imageDescription !== "string"
        || !activity.imageDescription
      ))
      || (activity.type === "dialogue-choice" && (
        !Array.isArray(activity.dialogue)
        || activity.dialogue.length < 2
        || activity.dialogue.some((line) => (
          !line
          || typeof line.speaker !== "string"
          || !line.speaker
          || typeof line.text !== "string"
          || !line.text
        ))
      ))
    ) {
      throw new Error(`A atividade ${activity?.id ?? "sem ID"} possui dados inválidos.`);
    }

    activityIds.add(activity.id);
  }

  return catalog;
}

loadBuildingCatalog()
  .then((catalog) => {
    buildingCatalog = catalog;
    for (const lot of lots) {
      if (lot.buildingId) updateLotButton(lot);
    }
    updateEconomyDisplay();
    renderSelectedLot();
  })
  .catch((error) => {
    console.error("Não foi possível carregar o catálogo de construções.", error);
    actionMessage.textContent = "Não foi possível carregar as construções. Atualize a página para tentar novamente.";
  });

loadActivityCatalog()
  .then((catalog) => {
    activityCatalog = catalog;
    openActivityButton.disabled = false;
  })
  .catch((error) => {
    console.error("Não foi possível carregar o catálogo de atividades.", error);
    activityLoadMessage.textContent = "Não foi possível carregar a atividade. Atualize a página para tentar novamente.";
  });

setInterval(() => {
  const storeCount = lots.filter((lot) => lot.buildingId === "store").length;
  if (storeCount === 0) return;

  const result = collectStoreIncome({
    balance,
    storeCount,
    coinsPerStore: gameConfig.economy.storeIncomePerMinute,
    coinLimit: gameConfig.economy.coinLimit,
  });
  if (!result.success || result.added === 0) return;

  balance = result.balance;
  updateEconomyDisplay();
  persistGame();
}, gameConfig.economy.storeIncomeIntervalMs);
