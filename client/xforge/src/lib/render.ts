export function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export function renderInline(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
}

export function renderBlock(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return ""
  const heading = lines[0].match(/^(#{1,3})\s+(.+)$/)
  if (heading) {
    const level = Math.min(heading[1].length + 1, 3)
    const rest = lines.slice(1).join(" ")
    return `<h${level}>${renderInline(heading[2])}</h${level}>${rest ? `<p>${renderInline(rest)}</p>` : ""}`
  }
  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return `<ul>${lines.map((line) => `<li>${renderInline(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`
  }
  return `<p>${renderInline(lines.join(" "))}</p>`
}

export function renderMarkdownLite(markdown: string) {
  const source = String(markdown)
    .trim()
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
  const blocks = source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
  return blocks.map(renderBlock).join("")
}
