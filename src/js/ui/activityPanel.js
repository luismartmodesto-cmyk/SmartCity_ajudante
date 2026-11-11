function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

const categoryNames = {
  vocabulary: "Vocabulário",
  "daily-phrases": "Frases do cotidiano",
  dialogues: "Diálogos curtos",
};

export function renderActivityPanel(container, activity, {
  index,
  total,
  audioEnabled,
}) {
  const card = document.createElement("div");
  card.className = "activity-card";

  const heading = document.createElement("div");
  heading.className = "activity-heading";
  heading.append(
    createTextElement("p", "eyebrow", `${categoryNames[activity.category]} · RASCUNHO`),
    createTextElement("h2", "", categoryNames[activity.category]),
    createTextElement("p", "activity-progress", `Atividade ${index + 1} de ${total}`),
  );

  const content = document.createElement("div");
  content.className = "activity-content";
  if (activity.dialogue) {
    const dialogue = document.createElement("div");
    dialogue.className = "activity-dialogue";
    dialogue.setAttribute("aria-label", "Diálogo");
    for (const line of activity.dialogue) {
      dialogue.append(createTextElement("p", "", `${line.speaker}: ${line.text}`));
    }
    content.append(dialogue);
  }
  if (activity.image) {
    const image = createTextElement("div", "activity-image", activity.image);
    image.setAttribute("role", "img");
    image.setAttribute("aria-label", activity.imageDescription);
    content.append(image);
  }
  content.append(createTextElement("p", "activity-prompt", activity.prompt));

  const audioControls = document.createElement("div");
  audioControls.className = "activity-audio-controls";
  const listenButton = createTextElement("button", "activity-audio-button", "Ouvir");
  listenButton.type = "button";
  listenButton.dataset.activityAction = "listen";
  listenButton.disabled = !audioEnabled;
  const toggleAudioButton = createTextElement(
    "button",
    "activity-audio-button",
    `Áudio: ${audioEnabled ? "ligado" : "desligado"}`,
  );
  toggleAudioButton.type = "button";
  toggleAudioButton.dataset.activityAction = "toggle-audio";
  const audioStatus = createTextElement("span", "activity-audio-status", "");
  audioStatus.setAttribute("role", "status");
  audioControls.append(listenButton, toggleAudioButton, audioStatus);

  const options = document.createElement("div");
  options.className = "activity-options";
  options.setAttribute("role", "group");
  options.setAttribute("aria-label", "Alternativas de resposta");

  for (const option of activity.options) {
    const button = document.createElement("button");
    button.className = "activity-option";
    button.type = "button";
    button.dataset.answerId = option.id;
    button.textContent = option.text;
    options.append(button);
  }

  const feedback = document.createElement("p");
  feedback.className = "activity-feedback";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");

  const explanation = document.createElement("div");
  explanation.className = "activity-explanation";
  explanation.hidden = true;

  const nextButton = createTextElement("button", "activity-next-button", "Próxima atividade");
  nextButton.type = "button";
  nextButton.dataset.activityAction = "next";
  const backButton = createTextElement("button", "activity-back-button", "Voltar para a cidade");
  backButton.type = "button";
  backButton.dataset.activityAction = "back";

  const navigation = document.createElement("div");
  navigation.className = "activity-navigation";
  navigation.append(nextButton, backButton);

  card.append(heading, content, audioControls, options, feedback, explanation, navigation);
  container.replaceChildren(card);
}

export function renderActivityFeedback(container, { correct, activity, message }) {
  const feedback = container.querySelector(".activity-feedback");
  const explanation = container.querySelector(".activity-explanation");

  explanation.replaceChildren();
  explanation.hidden = true;

  if (correct) {
    feedback.textContent = message ?? "Muito bem! Sua resposta está correta.";
    feedback.classList.add("is-correct");
    feedback.classList.remove("is-incorrect");
    return;
  }

  feedback.textContent = "Ainda não. Você pode tentar novamente.";
  feedback.classList.add("is-incorrect");
  feedback.classList.remove("is-correct");
  explanation.hidden = false;
  explanation.append(
    createTextElement("p", "", `Dica: ${activity.hint}`),
    createTextElement("p", "", `Explicação: ${activity.explanation}`),
  );
}
