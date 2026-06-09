import assert from "node:assert/strict";
import test from "node:test";
import { isBlockedHost, isXArticleHost, validateUrl } from "../src/urlSafety.js";

test("isBlockedHost rejects localhost and private ranges", () => {
  assert.equal(isBlockedHost("localhost"), true);
  assert.equal(isBlockedHost("127.0.0.1"), true);
  assert.equal(isBlockedHost("10.0.0.1"), true);
  assert.equal(isBlockedHost("192.168.1.5"), true);
  assert.equal(isBlockedHost("169.254.169.254"), true);
  assert.equal(isBlockedHost("metadata.google.internal"), true);
  assert.equal(isBlockedHost("::ffff:127.0.0.1"), true);
  assert.equal(isBlockedHost("example.com"), false);
});

test("validateUrl rejects blocked hosts", async () => {
  await assert.rejects(() => validateUrl("http://127.0.0.1/admin"), /not allowed/i);
  await assert.rejects(() => validateUrl("http://localhost/"), /not allowed/i);
  await assert.rejects(() => validateUrl("http://169.254.169.254/latest/meta-data/"), /not allowed/i);
});

test("validateUrl rejects non-http protocols", async () => {
  await assert.rejects(() => validateUrl("file:///etc/passwd"), /Only http\/https/i);
});

test("isXArticleHost accepts x.com and twitter.com hosts", () => {
  assert.equal(isXArticleHost("x.com"), true);
  assert.equal(isXArticleHost("www.x.com"), true);
  assert.equal(isXArticleHost("twitter.com"), true);
  assert.equal(isXArticleHost("mobile.twitter.com"), true);
  assert.equal(isXArticleHost("example.com"), false);
});

test("validateUrl accepts X Article URLs", async () => {
  const url = await validateUrl("https://x.com/writer/status/1");
  assert.equal(url, "https://x.com/writer/status/1");
});

test("validateUrl rejects non-X hosts", async () => {
  await assert.rejects(
    () => validateUrl("https://example.com/article"),
    /Only X Article URLs/i
  );
});
