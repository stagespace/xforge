import assert from "node:assert/strict";
import test from "node:test";
import { resolveAccess } from "../src/access.js";

function mockReq({ token, ip = "203.0.113.10" } = {}) {
  return {
    get(name) {
      if (name === "x-app-token") return token;
      if (name === "x-forwarded-for") return ip;
      return undefined;
    },
    socket: { remoteAddress: ip }
  };
}

function cfg(overrides = {}) {
  return {
    appAuthToken: "secret-token",
    isProduction: false,
    allowDemoMode: false,
    ...overrides
  };
}

test("invalid token is always denied", () => {
  const access = resolveAccess(mockReq({ token: "wrong" }), cfg());
  assert.equal(access.tier, "denied");
});

test("production without demo mode denies missing token", () => {
  const access = resolveAccess(mockReq(), cfg({ isProduction: true }));
  assert.equal(access.tier, "denied");
});

test("production with demo mode allows missing token", () => {
  const access = resolveAccess(mockReq(), cfg({ isProduction: true, allowDemoMode: true }));
  assert.equal(access.tier, "demo");
});

test("production with demo mode still denies invalid token", () => {
  const access = resolveAccess(
    mockReq({ token: "wrong" }),
    cfg({ isProduction: true, allowDemoMode: true })
  );
  assert.equal(access.tier, "denied");
});

test("valid token grants private tier", () => {
  const access = resolveAccess(mockReq({ token: "secret-token" }), cfg());
  assert.equal(access.tier, "private");
});
