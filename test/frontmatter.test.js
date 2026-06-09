import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFrontmatter,
  buildDocumentWithFrontmatter,
  escapeYamlString,
  formatDate
} from "../src/frontmatter.js";

test("buildFrontmatter emits note-ready YAML for X articles", () => {
  const yaml = buildFrontmatter({
    title: "How to use GPT-5.5 effectively",
    author: "Mateusz Mirkowski",
    source: "https://x.com/llmdevguy/status/2048736363600613776",
    date: "2026-04-27",
    tags: ["x-article"]
  });

  assert.match(yaml, /^---\n/);
  assert.match(yaml, /title: How to use GPT-5\.5 effectively/);
  assert.match(yaml, /author: Mateusz Mirkowski/);
  assert.match(yaml, /source: "https:\/\/x\.com\/llmdevguy\/status\/2048736363600613776"/);
  assert.match(yaml, /date: 2026-04-27/);
  assert.match(yaml, /tags:\n  - x-article\n---$/);
});

test("escapeYamlString quotes values with YAML special characters", () => {
  assert.equal(escapeYamlString("Title: with colon"), '"Title: with colon"');
  assert.equal(escapeYamlString('Say "hello"'), '"Say \\"hello\\""');
  assert.equal(escapeYamlString("plain-author"), "plain-author");
});

test("buildDocumentWithFrontmatter prepends frontmatter before body", () => {
  const doc = buildDocumentWithFrontmatter({
    title: "Sample",
    author: "@writer",
    source: "https://x.com/writer/status/1",
    date: "Apr 27, 2026",
    body: "First paragraph.\n\nSecond paragraph.",
    isXArticle: true
  });

  assert.match(doc, /^---\n/);
  assert.match(doc, /tags:\n  - x-article/);
  assert.match(doc, /date: 2026-04-27/);
  assert.match(doc, /First paragraph\.\n\nSecond paragraph\.\n$/);
});

test("buildDocumentWithFrontmatter handles missing optional fields", () => {
  const doc = buildDocumentWithFrontmatter({
    title: "",
    author: "",
    source: "https://example.com/post",
    date: "",
    body: "Body only.",
    isXArticle: false
  });

  assert.match(doc, /tags:\n  - article/);
  assert.doesNotMatch(doc, /author:/);
  assert.doesNotMatch(doc, /date:/);
  assert.match(doc, /Body only\./);
});

test("formatDate normalizes ISO, Date, and month-name inputs", () => {
  assert.equal(formatDate("2026-04-27T12:00:00.000Z"), "2026-04-27");
  assert.equal(formatDate(new Date("2026-04-27T00:00:00.000Z")), "2026-04-27");
  assert.equal(formatDate("Apr 27, 2026"), "2026-04-27");
});
