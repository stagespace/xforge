import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAccess } from "./access.js";
import { stripMarkdownNoise, slugFromTitle, extractArticleMetadata, resolveTitle } from "./cleanup.js";
import { buildDocumentWithFrontmatter } from "./frontmatter.js";
import { config, publicConfig, validateProductionConfig } from "./config.js";
import { scrapeToMarkdown } from "./firecrawl.js";
import { chatAboutArticle, summarizeMarkdown } from "./llm.js";
import { checkRateLimit } from "./rateLimit.js";
import { validateUrl } from "./urlSafety.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", true);
const port = Number(process.env.PORT || 3107);
const clientDist = path.join(__dirname, "../client/xforge/dist");
const clientIndex = path.join(clientDist, "index.html");
const hasClientBuild = fs.existsSync(clientIndex);

app.use(express.json({ limit: "2mb" }));
if (hasClientBuild) {
  app.use(express.static(clientDist));
} else {
  console.warn(
    "[xforge] No client build at client/xforge/dist — run `npm run build`. Serving API only."
  );
}

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "xforge" });
});

app.get("/api/config", (_req, res) => {
  res.json({ ok: true, ...publicConfig() });
});

app.post("/api/session", (req, res) => {
  const access = resolveAccess(req, config);
  if (access.tier === "denied") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  res.json({ ok: true, tier: access.tier });
});

app.post("/api/scrape", async (req, res) => {
  const access = resolveAccess(req, config);
  if (access.tier === "denied") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  const limit = enforceRateLimit(res, access, "scrape");
  if (!limit.allowed) return;

  try {
    const url = await validateUrl(req.body?.url);
    const data = await scrapeToMarkdown(url);
    const rawMarkdown = data.markdown || "";
    const sourceUrl = data.metadata?.sourceURL || data.metadata?.url || data.sourceURL || url;
    const cleaned = stripMarkdownNoise(rawMarkdown, sourceUrl);
    const extracted = extractArticleMetadata(rawMarkdown, cleaned.markdown, sourceUrl);
    const title = resolveTitle(data.metadata?.title || data.title, cleaned.markdown, sourceUrl);
    const author = extracted.author || data.metadata?.author || "";
    const publishedDate =
      extracted.publishedDate ||
      data.metadata?.publishedTime ||
      data.metadata?.modifiedTime ||
      data.metadata?.date ||
      "";
    const filename = `${(publishedDate || new Date().toISOString()).slice(0, 10)}_${slugFromTitle(title)}.md`;
    const markdown = buildDocumentWithFrontmatter({
      title,
      author,
      source: sourceUrl,
      date: publishedDate,
      body: cleaned.markdown,
      isXArticle: /\/\/(?:www\.)?(x|twitter)\.com\//i.test(sourceUrl)
    });
    res.json({
      ok: true,
      tier: access.tier,
      title,
      author,
      publishedDate,
      sourceUrl,
      filename,
      status: cleaned.warnings.length ? "passed_with_warnings" : "clean",
      warnings: cleaned.warnings,
      markdown,
      rawLength: rawMarkdown.length,
      cleanedLength: cleaned.markdown.length,
      removedLineCount: cleaned.removedLineCount,
      rateLimit: limit
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const access = resolveAccess(req, config);
  if (access.tier === "denied") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  const limit = enforceRateLimit(res, access, "chat");
  if (!limit.allowed) return;

  try {
    const articleMarkdown = String(req.body?.articleMarkdown || "").trim();
    const summaryMarkdown = String(req.body?.summaryMarkdown || "").trim();
    const question = String(req.body?.question || "").trim();
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!articleMarkdown) throw new Error("Article Markdown is required.");
    if (!question) throw new Error("Question is required.");
    const answer = await chatAboutArticle({
      articleMarkdown,
      summaryMarkdown,
      messages,
      question
    });
    res.json({ ok: true, tier: access.tier, rateLimit: limit, ...answer });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/summarize", async (req, res) => {
  const access = resolveAccess(req, config);
  if (access.tier === "denied") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  const limit = enforceRateLimit(res, access, "summarize");
  if (!limit.allowed) return;

  try {
    const markdown = String(req.body?.markdown || "").trim();
    if (!markdown) throw new Error("Markdown is required.");
    const sourceUrl = String(req.body?.sourceUrl || "");
    const summary = await summarizeMarkdown(markdown, { sourceUrl });
    res.json({ ok: true, tier: access.tier, rateLimit: limit, ...summary });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

function enforceRateLimit(res, access, action) {
  const limit = config.limits[access.tier]?.[action] ?? 0;
  const result = checkRateLimit({
    tier: access.tier,
    action,
    clientId: access.clientId,
    limit
  });
  if (!result.allowed) {
    res.status(429).json({ ok: false, error: result.error, rateLimit: result });
  }
  return result;
}

if (hasClientBuild) {
  app.get("/{*path}", (req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api/") || req.path === "/healthz") return next();
    res.sendFile(clientIndex);
  });
}

if (process.env.NODE_ENV !== "test") {
  validateProductionConfig();
  app.listen(port, "0.0.0.0", () => {
    console.log(`XForge listening on ${port}`);
  });
}

export { app };
