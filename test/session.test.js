import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.APP_AUTH_TOKEN = "test-token";
process.env.FIREWORKS_API = "test-fireworks-key";
process.env.FIRECRAWL_API_KEY = "test-key";
process.env.FIRECRAWL_API_URL = "https://firecrawl.example.test";

const { app } = await import("../src/server.js");

test("session endpoint allows demo access without token", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/session`, { method: "POST" });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.tier, "demo");
  } finally {
    server.close();
  }
});

test("session endpoint rejects invalid token", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/session`, {
      method: "POST",
      headers: { "x-app-token": "wrong-token" }
    });
    const data = await response.json();
    assert.equal(response.status, 401);
    assert.equal(data.ok, false);
  } finally {
    server.close();
  }
});

test("session endpoint accepts valid token as private tier", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/session`, {
      method: "POST",
      headers: { "x-app-token": "test-token" }
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.tier, "private");
  } finally {
    server.close();
  }
});

test("config endpoint exposes access tiers without model labels", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/config`);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.aiAvailable, true);
    assert.equal(data.privateAvailable, true);
    assert.equal(data.demoAvailable, true);
    assert.equal(data.models, undefined);
  } finally {
    server.close();
  }
});
