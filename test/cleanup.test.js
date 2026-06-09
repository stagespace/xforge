import assert from "node:assert/strict";
import test from "node:test";
import {
  stripMarkdownNoise,
  extractArticleMetadata,
  resolveTitle
} from "../src/cleanup.js";

test("removes X logged-out chrome after article body", () => {
  const input = [
    "Did someone say ... cookies?",
    "Conversation",
    "Mateusz Mirkowski",
    "@llmdevguy",
    "How to use GPT-5.5 effectively. Do other models still make sense?",
    "",
    "GPT-5.5 is definitely the most interesting model.",
    "",
    "Want to publish your own Article?",
    "Upgrade to Premium",
    "12:09 PM · Apr 27, 2026",
    "69.5K",
    "Views",
    "Relevant people",
    "Something went wrong. Try reloading.",
    "© 2026 X Corp."
  ].join("\n");

  const result = stripMarkdownNoise(input, "https://x.com/llmdevguy/status/2048736363600613776");
  assert.match(result.markdown, /How to use GPT-5\.5 effectively/);
  assert.match(result.markdown, /GPT-5\.5 is definitely/);
  assert.doesNotMatch(result.markdown, /Upgrade to Premium/);
  assert.doesNotMatch(result.markdown, /Relevant people/);
  assert.doesNotMatch(result.markdown, /© 2026 X Corp/);
  assert.ok(result.warnings.length >= 1);
});

test("extractArticleMetadata pulls author and published date from X markdown", () => {
  const input = [
    "Did someone say ... cookies?",
    "Conversation",
    "Mateusz Mirkowski",
    "@llmdevguy",
    "How to use GPT-5.5 effectively. Do other models still make sense?",
    "",
    "GPT-5.5 is definitely the most interesting model.",
    "",
    "12:09 PM · Apr 27, 2026",
    "69.5K",
    "Views"
  ].join("\n");

  const cleaned = stripMarkdownNoise(input, "https://x.com/llmdevguy/status/2048736363600613776");
  const metadata = extractArticleMetadata(input, cleaned.markdown, "https://x.com/llmdevguy/status/2048736363600613776");

  assert.equal(metadata.author, "Mateusz Mirkowski");
  assert.equal(metadata.publishedDate, "2026-04-27");
  assert.equal(
    resolveTitle("Article", cleaned.markdown, "https://x.com/llmdevguy/status/2048736363600613776"),
    "How to use GPT-5.5 effectively. Do other models still make sense?"
  );
});

test("generic cleanup trims known social footer", () => {
  const result = stripMarkdownNoise("Article\n\nBody\n\nNew to X?\nSign up now", "https://example.com/a");
  assert.equal(result.markdown, "Article\n\nBody");
  assert.deepEqual(result.warnings, ["Trimmed known social-page footer chrome."]);
});
