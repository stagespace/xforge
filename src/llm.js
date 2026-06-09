import { config } from "./config.js";
import { fireworksChatCompletion } from "./fireworks.js";
import { chatPrompt, summarizePrompt } from "./prompts.js";

function truncate(text, maxChars, label) {
  const value = String(text || "");
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[Truncated ${label} to ${maxChars} characters.]`;
}

async function summarizeMarkdown(markdown, { sourceUrl = "" } = {}) {
  const clipped = truncate(markdown, config.aiMaxInputChars, "article");
  if (!config.fireworksApiKey) {
    throw new Error("Summarize is not configured on this server.");
  }
  const result = await fireworksChatCompletion({
    model: config.fireworksModelFlash,
    userPrompt: summarizePrompt(clipped, sourceUrl),
    maxTokens: 1800
  });
  return {
    model: result.model,
    summary: result.text
  };
}

async function chatAboutArticle({
  articleMarkdown,
  summaryMarkdown,
  messages = [],
  question
}) {
  const clippedArticle = truncate(articleMarkdown, config.aiMaxChatArticleChars, "article");
  const clippedSummary = truncate(summaryMarkdown, config.aiMaxChatSummaryChars, "summary");

  if (!config.fireworksApiKey) {
    throw new Error("Chat is not configured on this server.");
  }

  const useSummaryOnly = messages.length > 0;
  const result = await fireworksChatCompletion({
    model: config.fireworksModelFlash,
    userPrompt: chatPrompt({
      articleMarkdown: useSummaryOnly
        ? `[See summary below for article context from ${clippedArticle.length} chars.]`
        : clippedArticle,
      summaryMarkdown: clippedSummary,
      messages,
      question
    }),
    maxTokens: 1200
  });

  return {
    model: result.model,
    answer: result.text
  };
}

export { chatAboutArticle, summarizeMarkdown };
