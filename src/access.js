import crypto from "node:crypto";

function clientId(req) {
  const cfIp = req.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwarded = req.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  return ip;
}

function tokensMatch(expected, actual) {
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function resolveAccess(req, config) {
  const expected = config.appAuthToken;
  const actual = String(req.get("x-app-token") || "").trim();
  const id = clientId(req);

  if (expected && actual) {
    if (tokensMatch(expected, actual)) {
      return { tier: "private", clientId: `token:${expected}` };
    }
    return { tier: "denied", clientId: id };
  }

  if (expected && !actual) {
    if (config.isProduction && !config.allowDemoMode) {
      return { tier: "denied", clientId: id };
    }
    return { tier: "demo", clientId: id };
  }

  if (config.isProduction && !config.allowDemoMode) {
    return { tier: "denied", clientId: id };
  }

  return { tier: "demo", clientId: id };
}

export { clientId, resolveAccess, tokensMatch };
