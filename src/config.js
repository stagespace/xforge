function readInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function fireworksApiKey() {
  return (process.env.FIREWORKS_API || process.env.FIREWORKS_API_KEY || "").trim();
}

function appAuthToken() {
  return (process.env.APP_AUTH_TOKEN || process.env.ARTICLE_MD_TOOL_APP_TOKEN || "").trim();
}

const config = {
  get fireworksApiKey() {
    return fireworksApiKey();
  },
  fireworksBaseUrl: (process.env.FIREWORKS_BASE_URL || "https://api.fireworks.ai/inference/v1").replace(/\/+$/, ""),
  fireworksModelFlash: (
    process.env.FIREWORKS_MODEL_FLASH || "accounts/fireworks/models/deepseek-v4-flash"
  ).trim(),
  get geminiApiKey() {
    return (process.env.GEMINI_API_KEY || "").trim();
  },
  get appAuthToken() {
    return appAuthToken();
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get allowDemoMode() {
    return process.env.ALLOW_DEMO_MODE === "true";
  },
  aiMaxInputChars: readInt("AI_MAX_INPUT_CHARS", 24000),
  aiMaxChatArticleChars: readInt("AI_MAX_CHAT_ARTICLE_CHARS", 12000),
  aiMaxChatSummaryChars: readInt("AI_MAX_CHAT_SUMMARY_CHARS", 8000),
  limits: {
    demo: {
      scrape: readInt("AI_DAILY_DEMO_SCRAPE_LIMIT", 10),
      summarize: readInt("AI_DAILY_DEMO_SUMMARIZE_LIMIT", 10),
      chat: readInt("AI_DAILY_DEMO_CHAT_LIMIT", 20)
    },
    private: {
      scrape: readInt("AI_DAILY_PRIVATE_SCRAPE_LIMIT", 200),
      summarize: readInt("AI_DAILY_PRIVATE_SUMMARIZE_LIMIT", 100),
      chat: readInt("AI_DAILY_PRIVATE_CHAT_LIMIT", 300)
    }
  }
};

function validateProductionConfig() {
  if (process.env.NODE_ENV !== "production") return;

  const hasToken = Boolean(config.appAuthToken);
  const hasDemoMode = config.allowDemoMode;

  if (!hasToken && !hasDemoMode) {
    console.error(
      "[xforge] Refusing to start in production without APP_AUTH_TOKEN or ALLOW_DEMO_MODE=true."
    );
    console.error("[xforge] See README.md — Production deployment.");
    process.exit(1);
  }
}

function publicConfig() {
  const hasAi = Boolean(config.fireworksApiKey);
  const authRequired = Boolean(config.appAuthToken);
  const demoEnabled =
    hasAi && (!config.isProduction || config.allowDemoMode || !authRequired);

  return {
    authRequired,
    demoMode: config.allowDemoMode,
    demoAvailable: demoEnabled,
    privateAvailable: authRequired,
    aiAvailable: hasAi,
    limits: config.limits
  };
}

export { config, publicConfig, validateProductionConfig };
