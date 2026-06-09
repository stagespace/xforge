const buckets = new Map();
let currentDay = dayKey();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function bucketKey(tier, action, clientId) {
  return `${tier}:${action}:${clientId}`;
}

function checkRateLimit({ tier, action, clientId, limit }) {
  const today = dayKey();
  if (today !== currentDay) {
    buckets.clear();
    currentDay = today;
  }

  if (!limit || limit <= 0) {
    return { allowed: true, remaining: null, resetDay: today };
  }

  const key = bucketKey(tier, action, clientId);
  const count = buckets.get(key) || 0;
  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetDay: today,
      error: `Daily ${action} limit reached for ${tier} access (${limit}/day). Try again tomorrow or log in with a private token.`
    };
  }

  buckets.set(key, count + 1);
  return {
    allowed: true,
    remaining: limit - count - 1,
    resetDay: today
  };
}

function resetRateLimitsForTests() {
  buckets.clear();
}

export { checkRateLimit, resetRateLimitsForTests };
