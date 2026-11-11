import assert from "node:assert/strict";
import test from "node:test";
import { speakText, stopSpeaking } from "../src/js/systems/audioSystem.js";

test("speaks English text and can stop the current pronunciation", (context) => {
  const originalWindow = globalThis.window;
  const calls = [];

  class MockUtterance {
    constructor(text) {
      this.text = text;
    }
  }

  context.after(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  globalThis.window = {
    SpeechSynthesisUtterance: MockUtterance,
    speechSynthesis: {
      cancel() {
        calls.push("cancel");
      },
      speak(utterance) {
        calls.push(utterance);
      },
    },
  };

  assert.equal(speakText("Hello"), true);
  assert.equal(calls[0], "cancel");
  assert.equal(calls[1].text, "Hello");
  assert.equal(calls[1].lang, "en-US");

  stopSpeaking();
  assert.equal(calls[2], "cancel");
});

test("reports when speech synthesis is unavailable", (context) => {
  const originalWindow = globalThis.window;
  context.after(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  globalThis.window = {};

  assert.equal(speakText("Hello"), false);
  assert.equal(speakText(""), false);
});
