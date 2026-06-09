import type { AppConfig } from "@/lib/types"

type ApiResult = {
  ok: boolean
  error?: string
  rateLimit?: unknown
  [key: string]: unknown
}

export async function apiPost(
  url: string,
  body: Record<string, unknown>,
  token: string
): Promise<ApiResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token.trim()) {
      headers["x-app-token"] = token.trim()
    }
    const response = await fetch(new URL(url.replace(/^\//, ""), window.location.href), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
    const data = (await response.json()) as ApiResult
    if (response.status === 429) {
      return {
        ok: false,
        error: data.error || "Daily limit reached.",
        rateLimit: data.rateLimit,
      }
    }
    return data
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Request failed.",
    }
  }
}

export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const response = await fetch(new URL("api/config", window.location.href))
    const data = await response.json()
    if (data.ok) {
      return {
        authRequired: Boolean(data.authRequired),
        demoAvailable: Boolean(data.demoAvailable),
        privateAvailable: Boolean(data.privateAvailable),
      }
    }
  } catch {
    /* use defaults */
  }
  return null
}

export function validateXArticleUrl(value: string): string | null {
  const text = String(value || "").trim()
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return "Invalid URL."
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return "Only http/https URLs are supported."
  }

  const host = url.hostname.toLowerCase()
  const isXHost =
    host === "x.com" ||
    host === "twitter.com" ||
    host.endsWith(".x.com") ||
    host.endsWith(".twitter.com")

  if (!isXHost) {
    return "Only X Article URLs (x.com or twitter.com) are supported."
  }

  return null
}

export function isUnauthorized(result: ApiResult) {
  return /unauthorized/i.test(result?.error || "")
}
