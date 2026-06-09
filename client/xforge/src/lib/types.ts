export type AccessTier = "demo" | "private"

export type AppConfig = {
  authRequired: boolean
  demoAvailable: boolean
  privateAvailable: boolean
}

export type ArticleMetrics = {
  status: string
  rawLength: number
  cleanedLength: number
  removedLineCount: number
  warnings?: string[]
}

export type HistoryItem = {
  id: string
  title: string
  url: string
  domain: string
  filename: string
  markdown: string
  author: string
  publishedDate: string
  metrics: ArticleMetrics
  summary?: string
  chatMessages?: ChatMessage[]
  timestamp: number
}

export type ChatMessage = {
  role: "user" | "ai"
  content: string
}

export type SummarySections = {
  tldr: string
  keyPoints: SummaryGridItem[]
  claims: SummaryGridItem[]
  takeaways: SummaryGridItem[]
}

export type SummaryGridItem = {
  label: string
  value: string
}

export type ServiceStatus =
  | { kind: "ready"; label: string }
  | { kind: "busy"; label: string }
  | { kind: "error"; label: string }
  | { kind: "demo"; label: string }
  | { kind: "private"; label: string }
