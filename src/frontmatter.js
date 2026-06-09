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

function escapeYamlString(value) {
  if (value == null || value === "") return '""';
  const text = String(value);
  if (/[\n\r]/.test(text)) {
    const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  if (/["]|[:#{}[\],&*!|>%@`]|^\s|\s$/.test(text) || /^(true|false|null|yes|no|on|off|\d+)$/i.test(text)) {
    return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return text;
}

function formatDate(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }
  const monthMatch = text.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i
  );
  if (monthMatch) {
    const month = MONTH_MAP[monthMatch[1].slice(0, 3).toLowerCase()];
    const day = monthMatch[2].padStart(2, "0");
    return `${monthMatch[3]}-${month}-${day}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toISOString().slice(0, 10);
}

function buildFrontmatter({ title, author, source, date, tags = [] }) {
  const lines = ["---"];
  if (title) lines.push(`title: ${escapeYamlString(title)}`);
  if (author) lines.push(`author: ${escapeYamlString(author)}`);
  if (source) lines.push(`source: ${escapeYamlString(source)}`);
  if (date) lines.push(`date: ${escapeYamlString(formatDate(date))}`);
  if (tags.length) {
    lines.push("tags:");
    for (const tag of tags) {
      lines.push(`  - ${escapeYamlString(tag)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function buildDocumentWithFrontmatter({ title, author, source, date, body, isXArticle = false }) {
  const tags = isXArticle ? ["x-article"] : ["article"];
  const frontmatter = buildFrontmatter({ title, author, source, date, tags });
  const trimmedBody = String(body || "").trim();
  return trimmedBody ? `${frontmatter}\n\n${trimmedBody}\n` : `${frontmatter}\n`;
}

export {
  buildFrontmatter,
  buildDocumentWithFrontmatter,
  escapeYamlString,
  formatDate,
  isXArticleUrl
};
