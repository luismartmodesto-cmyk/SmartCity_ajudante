export function speakText(text, language = "en-US") {
  if (
    typeof text !== "string"
    || !text
    || typeof window === "undefined"
    || !window.speechSynthesis
    || typeof window.SpeechSynthesisUtterance !== "function"
  ) {
    return false;
  }

  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = language;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
