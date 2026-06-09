import type { SummaryGridItem, SummarySections } from "@/lib/types"

function parseBullets(body: string): SummaryGridItem[] {
  const bulletLines = body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
  const source = bulletLines.length
    ? bulletLines
    : body
        .split("\n\n")
        .map((line) => line.trim())
        .filter(Boolean)
  return source.map((line) => {
    const text = line.replace(/^[-*]\s+/, "")
    const labelMatch =
      text.match(/^\*\*(.+?):\*\*\s*(.*)$/) ||
      text.match(/^([^:]{3,80}):\s*(.*)$/)
    if (labelMatch) {
      return { label: labelMatch[1], value: labelMatch[2] || "" }
    }
    return { label: "Point", value: text }
  })
}

export function parseSummary(markdown: string): SummarySections {
  const clean = String(markdown)
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
  const sections: SummarySections = {
    tldr: "",
    keyPoints: [],
    claims: [],
    takeaways: [],
  }
  const chunks = clean
    .split(/^##\s+/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  for (const chunk of chunks) {
    const [headingLine, ...bodyLines] = chunk.split("\n")
    const heading = headingLine.toLowerCase()
    const body = bodyLines.join("\n").trim()
    if (heading.includes("tl;dr") || heading.includes("tldr")) {
      sections.tldr = body
    } else if (heading.includes("key point")) {
      sections.keyPoints = parseBullets(body)
    } else if (heading.includes("claim")) {
      sections.claims = parseBullets(body)
    } else if (heading.includes("takeaway")) {
      sections.takeaways = parseBullets(body)
    }
  }
  return sections
}

export function formatMetaLine(
  metrics: { status: string; cleanedLength: number; removedLineCount: number },
  author?: string,
  publishedDate?: string
) {
  const parts = [metrics.status]
  if (author) parts.push(author)
  if (publishedDate) parts.push(publishedDate)
  parts.push(`${metrics.cleanedLength} chars`)
  parts.push(`${metrics.removedLineCount} noisy lines removed`)
  return parts.join(" · ")
}
