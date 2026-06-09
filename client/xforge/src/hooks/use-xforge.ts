import * as React from "react"

import {
  apiPost,
  fetchAppConfig,
  isUnauthorized,
  validateXArticleUrl,
} from "@/lib/api"
import {
  clearToken,
  HISTORY_STORAGE_KEY,
  readToken,
  writeToken,
} from "@/lib/storage"
import { formatMetaLine } from "@/lib/summary"
import type {
  AccessTier,
  AppConfig,
  ChatMessage,
  HistoryItem,
  ServiceStatus,
} from "@/lib/types"

const defaultConfig: AppConfig = {
  authRequired: false,
  demoAvailable: true,
  privateAvailable: false,
}

function getHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveHistory(history: HistoryItem[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
}

export function useXForge() {
  const [appConfig, setAppConfig] = React.useState<AppConfig>(defaultConfig)
  const [token, setToken] = React.useState(readToken)
  const [accessTier, setAccessTier] = React.useState<AccessTier>(
    readToken() ? "private" : "demo"
  )
  const [serviceStatus, setServiceStatus] = React.useState<ServiceStatus>({
    kind: "ready",
    label: "Ready",
  })
  const [history, setHistory] = React.useState<HistoryItem[]>(getHistory)
  const [url, setUrl] = React.useState("")
  const [isExtracting, setIsExtracting] = React.useState(false)
  const [isSummarizing, setIsSummarizing] = React.useState(false)
  const [isChatting, setIsChatting] = React.useState(false)
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)

  const [currentArticleId, setCurrentArticleId] = React.useState<string | null>(
    null
  )
  const [currentFilename, setCurrentFilename] = React.useState("article.md")
  const [currentSourceUrl, setCurrentSourceUrl] = React.useState("")
  const [currentMarkdown, setCurrentMarkdown] = React.useState("")
  const [currentSummary, setCurrentSummary] = React.useState("")
  const [articleTitle, setArticleTitle] = React.useState("No X Article loaded")
  const [articleMeta, setArticleMeta] = React.useState(
    "Paste an X Article link above to get started."
  )
  const [author, setAuthor] = React.useState("")
  const [publishedDate, setPublishedDate] = React.useState("")
  const [metrics, setMetrics] = React.useState<HistoryItem["metrics"] | null>(
    null
  )
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([])
  const [activeTab, setActiveTab] = React.useState("markdown")
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle")

  const isLoggedIn = Boolean(token.trim())

  React.useEffect(() => {
    void (async () => {
      const config = await fetchAppConfig()
      if (config) {
        setAppConfig(config)
      }
      updateAccessBadge(accessTier, config ?? defaultConfig)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (
      serviceStatus.kind === "busy" ||
      serviceStatus.kind === "error"
    ) {
      return
    }
    updateAccessBadge(accessTier, appConfig)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessTier, appConfig.demoAvailable])

  function updateAccessBadge(tier: AccessTier, config: AppConfig) {
    if (tier === "private") {
      setServiceStatus({ kind: "private", label: "Signed in" })
      return
    }
    if (config.demoAvailable) {
      setServiceStatus({ kind: "demo", label: "Ready" })
      return
    }
    setServiceStatus({ kind: "ready", label: "Sign in required" })
  }

  function setBusy(label: string) {
    setServiceStatus({ kind: "busy", label })
  }

  function setError(label: string) {
    setServiceStatus({ kind: "error", label })
  }

  function refreshHistory(nextHistory = getHistory()) {
    setHistory(nextHistory)
  }

  function addToHistory(article: HistoryItem) {
    let next = getHistory().filter((item) => item.url !== article.url)
    next = [article, ...next]
    if (next.length > 50) next = next.slice(0, 50)
    saveHistory(next)
    refreshHistory(next)
  }

  function updateHistoryItem(id: string, updates: Partial<HistoryItem>) {
    const next = getHistory().map((item) =>
      item.id === id ? { ...item, ...updates } : item
    )
    saveHistory(next)
    refreshHistory(next)
  }

  function resetArticleState() {
    setCurrentArticleId(null)
    setCurrentFilename("article.md")
    setCurrentSourceUrl("")
    setCurrentMarkdown("")
    setCurrentSummary("")
    setArticleTitle("No X Article loaded")
    setArticleMeta("Paste an X Article link above to get started.")
    setAuthor("")
    setPublishedDate("")
    setMetrics(null)
    setChatMessages([])
    setActiveTab("markdown")
  }

  function startNewExtraction() {
    resetArticleState()
    setUrl("")
    setServiceStatus({ kind: "ready", label: "Ready" })
  }

  function loadArticleFromHistory(id: string) {
    const article = getHistory().find((item) => item.id === id)
    if (!article) return

    setCurrentArticleId(article.id)
    setCurrentFilename(article.filename)
    setCurrentSourceUrl(article.url)
    setCurrentMarkdown(article.markdown)
    setCurrentSummary(article.summary || "")
    setChatMessages(article.chatMessages || [])
    setUrl(article.url)
    setArticleTitle(article.title)
    setAuthor(article.author)
    setPublishedDate(article.publishedDate)
    setMetrics(article.metrics)
    setArticleMeta(
      formatMetaLine(article.metrics, article.author, article.publishedDate)
    )

    if (article.summary) {
      setActiveTab("dashboard")
    } else {
      setActiveTab("markdown")
    }
    refreshHistory()
  }

  async function extractArticle(event?: React.FormEvent) {
    event?.preventDefault()
    const trimmedUrl = url.trim()
    if (!trimmedUrl) return

    const urlError = validateXArticleUrl(trimmedUrl)
    if (urlError) {
      setError(urlError)
      return
    }

    setIsExtracting(true)
    setBusy("Extracting article...")
    resetArticleState()

    const result = await apiPost("/api/scrape", { url: trimmedUrl }, token)
    setIsExtracting(false)

    if (!result.ok) {
      if (isUnauthorized(result)) {
        handleTokenRejected("Token rejected. Paste it again.")
      }
      setError(String(result.error || "Scrape failed."))
      return
    }

    if (token.trim()) writeToken(token)

    const markdown = String(result.markdown || "")
    const sourceUrl = String(result.sourceUrl || trimmedUrl)
    const title = String(result.title || "Untitled X Article")
    const nextMetrics = {
      status: String(result.status || "clean"),
      rawLength: Number(result.rawLength || 0),
      cleanedLength: Number(result.cleanedLength || 0),
      removedLineCount: Number(result.removedLineCount || 0),
      warnings: Array.isArray(result.warnings)
        ? result.warnings.map(String)
        : [],
    }

    setCurrentFilename(String(result.filename || "article.md"))
    setCurrentSourceUrl(sourceUrl)
    setCurrentMarkdown(markdown)
    setArticleTitle(title)
    setAuthor(String(result.author || ""))
    setPublishedDate(String(result.publishedDate || ""))
    setMetrics(nextMetrics)
    setArticleMeta(
      formatMetaLine(
        nextMetrics,
        String(result.author || ""),
        String(result.publishedDate || "")
      )
    )
    setActiveTab("markdown")

    const articleId = `art_${Date.now()}`
    setCurrentArticleId(articleId)
    const domain = new URL(sourceUrl).hostname.replace("www.", "")
    addToHistory({
      id: articleId,
      title,
      url: sourceUrl,
      domain,
      filename: String(result.filename || "article.md"),
      markdown,
      author: String(result.author || ""),
      publishedDate: String(result.publishedDate || ""),
      metrics: nextMetrics,
      timestamp: Date.now(),
    })

    setBusy("X Article ready")
    updateAccessBadge(accessTier, appConfig)
  }

  async function login() {
    if (!token.trim()) {
      setError("Paste the app token first.")
      return
    }
    setIsLoggingIn(true)
    setBusy("Checking token...")
    const result = await apiPost("/api/session", {}, token)
    setIsLoggingIn(false)
    if (!result.ok) {
      handleTokenRejected("Token rejected. Paste it again.")
      setError(String(result.error || "Login failed."))
      return
    }
    writeToken(token)
    const tier = (result.tier === "private" ? "private" : "demo") as AccessTier
    setAccessTier(tier)
    updateAccessBadge(tier, appConfig)
  }

  function logout() {
    clearToken()
    setToken("")
    setAccessTier("demo")
    updateAccessBadge("demo", appConfig)
  }

  function handleTokenRejected(message: string) {
    clearToken()
    setToken("")
    setAccessTier("demo")
    setError(message)
  }

  async function summarizeArticle() {
    if (!currentMarkdown.trim()) return
    setIsSummarizing(true)
    setBusy("Summarizing...")
    const result = await apiPost(
      "/api/summarize",
      {
        markdown: currentMarkdown,
        sourceUrl: currentSourceUrl,
      },
      token
    )
    setIsSummarizing(false)
    if (!result.ok) {
      if (isUnauthorized(result)) {
        handleTokenRejected("Token rejected. Paste it again.")
      }
      setError(String(result.error || "Summary failed."))
      return
    }
    if (token.trim()) writeToken(token)

    const summary = String(result.summary || "")
    setCurrentSummary(summary)
    const initialChat: ChatMessage[] = [
      {
        role: "ai",
        content:
          "I have the X Article and summary loaded. Ask a follow-up question, or use one of the quick actions below.",
      },
    ]
    setChatMessages(initialChat)
    setActiveTab("dashboard")

    if (currentArticleId) {
      updateHistoryItem(currentArticleId, {
        summary,
        chatMessages: initialChat,
      })
    }

    updateAccessBadge(accessTier, appConfig)
  }

  async function sendChat(question: string) {
    const trimmed = question.trim()
    if (!trimmed || !currentMarkdown.trim()) return

    const userMessage: ChatMessage = { role: "user", content: trimmed }
    const pendingMessages = [...chatMessages, userMessage]
    setChatMessages(pendingMessages)
    setIsChatting(true)

    const result = await apiPost(
      "/api/chat",
      {
        articleMarkdown: currentMarkdown,
        summaryMarkdown: currentSummary,
        messages: chatMessages,
        question: trimmed,
      },
      token
    )
    setIsChatting(false)

    if (!result.ok) {
      if (isUnauthorized(result)) {
        handleTokenRejected("Token rejected. Paste it again.")
      }
      const errorMessage: ChatMessage = {
        role: "ai",
        content: String(result.error || "Chat failed."),
      }
      const withError = [...pendingMessages, errorMessage]
      setChatMessages(withError)
      if (currentArticleId) {
        updateHistoryItem(currentArticleId, { chatMessages: withError })
      }
      return
    }

    const aiMessage: ChatMessage = {
      role: "ai",
      content: String(result.answer || ""),
    }
    const complete = [...pendingMessages, aiMessage]
    setChatMessages(complete)
    if (currentArticleId) {
      updateHistoryItem(currentArticleId, { chatMessages: complete })
    }
  }

  function downloadMarkdown() {
    const blob = new Blob([currentMarkdown], {
      type: "text/markdown;charset=utf-8",
    })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = currentFilename
    link.click()
    URL.revokeObjectURL(objectUrl)
  }

  async function copyMarkdown() {
    if (!currentMarkdown) return
    try {
      await navigator.clipboard.writeText(currentMarkdown)
      setCopyState("copied")
      window.setTimeout(() => setCopyState("idle"), 2000)
    } catch {
      setError("Failed to copy markdown.")
    }
  }

  function clearHistory() {
    if (
      !window.confirm(
        "Are you sure you want to clear your local scrape history?"
      )
    ) {
      return
    }
    localStorage.removeItem(HISTORY_STORAGE_KEY)
    refreshHistory([])
    resetArticleState()
    setUrl("")
  }

  const hasArticle = Boolean(currentMarkdown.trim())
  const hasSummary = Boolean(currentSummary.trim())
  const showWorkspace = hasArticle
  const showEmptyState = !hasArticle

  return {
    appConfig,
    token,
    setToken,
    accessTier,
    serviceStatus,
    history,
    url,
    setUrl,
    isLoggedIn,
    isExtracting,
    isSummarizing,
    isChatting,
    isLoggingIn,
    currentArticleId,
    currentMarkdown,
    currentSummary,
    articleTitle,
    articleMeta,
    author,
    publishedDate,
    metrics,
    chatMessages,
    activeTab,
    setActiveTab,
    copyState,
    hasArticle,
    hasSummary,
    showWorkspace,
    showEmptyState,
    extractArticle,
    login,
    logout,
    summarizeArticle,
    sendChat,
    downloadMarkdown,
    copyMarkdown,
    clearHistory,
    loadArticleFromHistory,
    startNewExtraction,
  }
}

export type XForgeState = ReturnType<typeof useXForge>
