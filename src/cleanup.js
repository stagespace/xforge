const LEADING_DROP_PATTERNS = [
  /^Did someone say/i,
  /^X and its partners use cookies/i,
  /^Accept all cookies$/i,
  /^Refuse non-essential cookies$/i,
  /^Don't miss what's happening$/i,
  /^Don.t miss what.s happening$/i,
  /^People on X are the first to know/i,
  /^\[Log in\]/i,
  /^\[Sign up\]/i,
  /^See this post in the app$/i,
  /^Use the app to view/i,
  /^\[Open X\]/i,
  /^=+$/,
  /^Article$/,
  /^-+$/,
  /^\[\]\(https:\/\/x\.com\/.*\/article\//i,
  /^See new posts$/i,
  /^Conversation$/,
  /^Follow$/,
  /^\[Follow\]/i,
  /^Show more replies$/i,
  /^Read \d+ replies$/i,
  /^Translate post$/i,
  /^Bookmark$/,
  /^Share$/
];

const TRAILING_STOP_PATTERNS = [
  /^Want to publish your own Article\??$/i,
  /^\[Upgrade to Premium\]/i,
  /^Upgrade to Premium$/i,
  /^New to X\??$/i,
  /^Sign up now to get your own personalized timeline/i,
  /^Relevant people$/i,
  /^Something went wrong\. Try reloading\.$/i,
  /^Terms of Service$/i,
  /^\[Terms of Service\]/i,
  /^© \d{4} X Corp\.$/i
];

const METRIC_ONLY_PATTERNS = [
  /^\[\d+[.\d]*[KMB]?\]\(https:\/\/(?:m\.)?x\.com\/.*\)$/i,
  /^\d+[.\d]*[KMB]?$/,
  /^Views$/i,
  /^Read \d+ replies$/i
];

function isImageOnly(line) {
  return /^\[?!?\[?Image\]?\(https:\/\/pbs\.twimg\.com\/media\//i.test(line)
    || /^\[!\[\]\(https:\/\/pbs\.twimg\.com\//i.test(line)
    || /^\[!\[Image\]\(https:\/\/pbs\.twimg\.com\//i.test(line);
}

function stripMarkdownNoise(markdown, sourceUrl = "") {
  const originalLines = markdown.replace(/\r\n/g, "\n").split("\n");
  const warnings = [];
  let lines = originalLines.map((line) => line.trimEnd());

  if (/\/\/(?:www\.)?(x|twitter)\.com\//i.test(sourceUrl)) {
    lines = stripXChrome(lines, warnings);
  } else {
    lines = stripGenericChrome(lines, warnings);
  }

  const cleaned = normalizeBlankLines(lines).trim();
  if (!cleaned) {
    warnings.push("Cleanup removed all markdown content.");
  }
  return {
    markdown: cleaned,
    warnings,
    removedLineCount: originalLines.length - cleaned.split("\n").length
  };
}

function stripXChrome(lines, warnings) {
  let start = 0;
  const handleIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return /^@[\w_]{1,20}$/.test(trimmed) || /^\[@[\w_]{1,20}\]\(/.test(trimmed);
  });
  if (handleIndex >= 0) {
    start = handleIndex + 1;
    warnings.push("Removed X logged-out header and profile preamble.");
  }

  let body = lines.slice(start).filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (/^\[\]\(/.test(trimmed)) return false;
    if (LEADING_DROP_PATTERNS.some((pattern) => pattern.test(trimmed))) return false;
    if (METRIC_ONLY_PATTERNS.some((pattern) => pattern.test(trimmed))) return false;
    return true;
  });

  const stopIndex = body.findIndex((line) =>
    TRAILING_STOP_PATTERNS.some((pattern) => pattern.test(line.trim()))
  );
  if (stopIndex >= 0) {
    body = body.slice(0, stopIndex);
    warnings.push("Trimmed X post footer, metrics, signup, and relevant-people chrome.");
  }

  body = body.filter((line) => !isImageOnly(line.trim()));
  return body;
}

function stripGenericChrome(lines, warnings) {
  const stopIndex = lines.findIndex((line) =>
    TRAILING_STOP_PATTERNS.some((pattern) => pattern.test(line.trim()))
  );
  if (stopIndex >= 0) {
    warnings.push("Trimmed known social-page footer chrome.");
    return lines.slice(0, stopIndex);
  }
  return lines;
}

function normalizeBlankLines(lines) {
  const out = [];
  let blankCount = 0;
  for (const line of lines) {
    if (!line.trim()) {
      blankCount += 1;
      if (blankCount <= 1) out.push("");
      continue;
    }
    blankCount = 0;
    out.push(line);
  }
  return out.join("\n");
}

function slugFromTitle(title, fallback = "article") {
  const slug = String(title || fallback)
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

const GENERIC_TITLES = /^(article|post|x|twitter|untitled|conversation)$/i;

const X_DATE_PATTERN =
  /\d{1,2}:\d{2}\s*[AP]M\s*[·•]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i;
const SHORT_DATE_PATTERN =
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/i;

const MONTH_MAP = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12"
};

function isXArticleUrl(url = "") {
  return /\/\/(?:www\.)?(x|twitter)\.com\//i.test(String(url));
}

function parseXDate(text) {
  const match = String(text).match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i
  );
  if (!match) return "";
  const month = MONTH_MAP[match[1].slice(0, 3).toLowerCase()];
  const day = match[2].padStart(2, "0");
  return `${match[3]}-${month}-${day}`;
}

function stripLinkText(line) {
  return String(line)
    .replace(/^\[([^\]]+)\]\([^)]+\)$/, "$1")
    .replace(/\*\*/g, "")
    .trim();
}

function looksLikeAuthorName(line) {
  const text = stripLinkText(line);
  if (!text || text.length > 80) return false;
  if (/^@/.test(text)) return false;
  if (LEADING_DROP_PATTERNS.some((pattern) => pattern.test(text))) return false;
  if (METRIC_ONLY_PATTERNS.some((pattern) => pattern.test(text))) return false;
  if (/^https?:\/\//i.test(text)) return false;
  return true;
}

function extractHandle(line) {
  const trimmed = line.trim();
  const plain = trimmed.match(/^@([\w_]{1,20})$/);
  if (plain) return `@${plain[1]}`;
  const linked = trimmed.match(/^\[@([\w_]{1,20})\]\(/);
  if (linked) return `@${linked[1]}`;
  return "";
}

function extractArticleMetadata(rawMarkdown, cleanedMarkdown, sourceUrl = "") {
  const lines = String(rawMarkdown || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());

  let author = "";
  let publishedDate = "";

  if (isXArticleUrl(sourceUrl)) {
    const handleIndex = lines.findIndex((line) => extractHandle(line));
    if (handleIndex >= 0) {
      const handle = extractHandle(lines[handleIndex]);
      if (handleIndex > 0 && looksLikeAuthorName(lines[handleIndex - 1])) {
        author = stripLinkText(lines[handleIndex - 1]);
      } else if (handle) {
        author = handle;
      }
    }

    for (const line of lines) {
      const timeMatch = line.match(X_DATE_PATTERN);
      if (timeMatch) {
        publishedDate = parseXDate(timeMatch[0]);
        break;
      }
      const shortMatch = line.match(SHORT_DATE_PATTERN);
      if (shortMatch && !publishedDate) {
        publishedDate = parseXDate(shortMatch[0]);
      }
    }
  }

  return { author, publishedDate };
}

function resolveTitle(scrapedTitle, cleanedMarkdown, sourceUrl = "") {
  const fromScrape = String(scrapedTitle || "").trim();
  if (fromScrape && !GENERIC_TITLES.test(fromScrape)) {
    return fromScrape.replace(/\s+[|\-–—]\s+X$/i, "").trim();
  }

  const lines = String(cleanedMarkdown || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = trimmed.match(/^#{1,2}\s+(.+)$/);
    if (heading) {
      return stripLinkText(heading[1]).slice(0, 160);
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 12) continue;
    if (/^@|^https?:\/\//i.test(trimmed)) continue;
    if (METRIC_ONLY_PATTERNS.some((pattern) => pattern.test(trimmed))) continue;
    if (X_DATE_PATTERN.test(trimmed) || SHORT_DATE_PATTERN.test(trimmed)) continue;
    return stripLinkText(trimmed).slice(0, 160);
  }

  return fromScrape || (isXArticleUrl(sourceUrl) ? "X Article" : "Untitled article");
}

export {
  stripMarkdownNoise,
  slugFromTitle,
  extractArticleMetadata,
  resolveTitle,
  isXArticleUrl
};

