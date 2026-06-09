import assert from "node:assert/strict";
import test from "node:test";
import { validateProductionConfig } from "../src/config.js";

const originalEnv = { ...process.env };

test.afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(originalEnv)) {
    process.env[key] = value;
  }
});

test("validateProductionConfig exits when production has no auth or demo flag", () => {
  process.env.NODE_ENV = "production";
  delete process.env.APP_AUTH_TOKEN;
  delete process.env.ARTICLE_MD_TOOL_APP_TOKEN;
  delete process.env.ALLOW_DEMO_MODE;

  let exitCode;
  const originalExit = process.exit;
  process.exit = (code) => {
    exitCode = code;
    throw new Error("process.exit");
  };

  try {
    assert.throws(() => validateProductionConfig(), /process\.exit/);
    assert.equal(exitCode, 1);
  } finally {
    process.exit = originalExit;
  }
});

test("validateProductionConfig allows production with APP_AUTH_TOKEN", () => {
  process.env.NODE_ENV = "production";
  process.env.APP_AUTH_TOKEN = "prod-secret";
  delete process.env.ALLOW_DEMO_MODE;
  assert.doesNotThrow(() => validateProductionConfig());
});

test("validateProductionConfig allows production with ALLOW_DEMO_MODE", () => {
  process.env.NODE_ENV = "production";
  delete process.env.APP_AUTH_TOKEN;
  process.env.ALLOW_DEMO_MODE = "true";
  assert.doesNotThrow(() => validateProductionConfig());
});
