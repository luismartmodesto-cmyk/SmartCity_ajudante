import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const questions = JSON.parse(
  readFileSync(new URL("../src/data/questions.json", import.meta.url), "utf8"),
);

test("contains 30 unique draft activities with valid answers and rewards", () => {
  assert.equal(questions.length, 30);
  assert.equal(new Set(questions.map((question) => question.id)).size, 30);

  for (const question of questions) {
    assert.equal(question.reviewStatus, "draft", question.id);
    assert.ok(["pre-A1", "A1"].includes(question.level), question.id);
    assert.ok(question.options.length >= 2, question.id);
    assert.ok(
      question.options.some((option) => option.id === question.correctAnswerId),
      question.id,
    );
    assert.deepEqual(question.reward, { coins: 20, xp: 10 }, question.id);
  }
});

test("covers the planned activity categories and formats", () => {
  assert.ok(questions.some((question) => question.category === "vocabulary"));
  assert.ok(questions.some((question) => question.category === "daily-phrases"));
  assert.ok(questions.some((question) => question.category === "dialogues"));
  assert.ok(questions.some((question) => question.type === "multiple-choice"));
  assert.ok(questions.some((question) => question.type === "association"));
  assert.ok(questions.some((question) => question.type === "dialogue-choice"));

  for (const question of questions.filter(({ type }) => type === "association")) {
    assert.ok(question.image, question.id);
    assert.ok(question.imageDescription, question.id);
  }
  for (const question of questions.filter(({ type }) => type === "dialogue-choice")) {
    assert.ok(question.dialogue.length >= 2, question.id);
  }
});
