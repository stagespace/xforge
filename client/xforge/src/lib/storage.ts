export const TOKEN_STORAGE_KEY = "article-md-tool-token"
export const HISTORY_STORAGE_KEY = "article-md-tool-history"

export function readToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || ""
}

export function writeToken(token: string) {
  if (token.trim()) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token.trim())
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
