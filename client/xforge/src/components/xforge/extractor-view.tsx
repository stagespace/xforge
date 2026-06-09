import { LogOut, Radio } from "lucide-react"

import type { XForgeState } from "@/hooks/use-xforge"
import type { ServiceStatus } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ChatPanel } from "@/components/xforge/chat-panel"
import { WorkspacePanel } from "@/components/xforge/workspace-panel"

const steps = [
  {
    num: "01",
    tag: "Paste",
    body: "Drop in a public X Article URL. Only x.com and twitter.com — we scrape it server-side.",
  },
  {
    num: "02",
    tag: "Frontmatter",
    body: "Title, author, date, source URL, and an x-article tag go into YAML at the top of the file.",
  },
  {
    num: "03",
    tag: "Export",
    body: "Download the .md, copy it, summarize, or chat with the article. Keys never leave the server.",
  },
]

type ExtractorViewProps = Pick<
  XForgeState,
  | "url"
  | "setUrl"
  | "isExtracting"
  | "extractArticle"
  | "articleTitle"
  | "articleMeta"
  | "hasArticle"
  | "downloadMarkdown"
  | "summarizeArticle"
  | "isSummarizing"
  | "serviceStatus"
  | "showWorkspace"
  | "showEmptyState"
  | "hasSummary"
  | "currentSummary"
  | "currentMarkdown"
  | "activeTab"
  | "setActiveTab"
  | "copyMarkdown"
  | "copyState"
  | "author"
  | "publishedDate"
  | "metrics"
  | "chatMessages"
  | "sendChat"
  | "isChatting"
>

export function ExtractorView(props: ExtractorViewProps) {
  const showError = props.serviceStatus.kind === "error"

  return (
    <div className="flex-1 py-6 stitch-margin sm:py-8 lg:py-12">
      <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-12 lg:space-y-16">
        {props.showEmptyState ? (
          <section className="border-b-2 border-foreground pb-12">
            <h1 className="stitch-display mb-4">
              X Articles,
              <br />
              marked down
            </h1>
            <p className="stitch-body-lg max-w-xl text-muted-foreground">
              Paste a public X Article link from x.com or twitter.com. XForge
              strips logged-out chrome, adds YAML frontmatter, and gives you a
              clean .md file for Obsidian, Logseq, or any notes app.
            </p>
          </section>
        ) : (
          <section className="border-b-2 border-foreground pb-8">
            <h1 className="stitch-headline-md mb-2 font-bold uppercase">
              {props.articleTitle}
            </h1>
            <p className="text-sm text-muted-foreground">{props.articleMeta}</p>
          </section>
        )}

        <section className="space-y-4">
          <label htmlFor="article-url" className="stitch-label text-muted-foreground">
            X Article URL
          </label>
          {showError ? (
            <Alert variant="destructive">
              <AlertDescription>{props.serviceStatus.label}</AlertDescription>
            </Alert>
          ) : null}
          <form
            onSubmit={props.extractArticle}
            className="flex flex-col border-2 border-foreground sm:flex-row"
          >
            <Input
              id="article-url"
              name="url"
              type="url"
              required
              placeholder="https://x.com/username/status/1234567890"
              value={props.url}
              onChange={(event) => props.setUrl(event.target.value)}
              className="h-auto min-h-12 flex-1 rounded-none border-0 border-b-2 border-foreground bg-transparent px-4 py-4 text-sm uppercase placeholder:opacity-20 focus-visible:border-primary focus-visible:ring-0 sm:border-b-0 sm:border-r-2 sm:px-6 sm:py-5 sm:text-base md:text-xl md:font-semibold"
            />
            <Button
              type="submit"
              disabled={props.isExtracting}
              className="h-auto min-h-12 w-full shrink-0 rounded-none border-0 bg-primary px-6 py-4 text-sm font-extrabold uppercase text-primary-foreground hover:invert sm:w-auto sm:px-10 sm:py-5 sm:text-base md:text-xl"
            >
              {props.isExtracting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Extracting
                </>
              ) : (
                "Extract"
              )}
            </Button>
          </form>
        </section>

        {props.hasArticle ? (
          <section className="flex flex-wrap items-center justify-between gap-4 border-2 border-foreground p-6">
            <div className="min-w-0">
              <p className="stitch-label text-muted-foreground">Loaded article</p>
              <p className="truncate text-sm font-semibold">{props.articleTitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!props.hasArticle}
                onClick={props.downloadMarkdown}
                className="h-10 rounded-none border-2 border-foreground bg-transparent uppercase tracking-wide hover:bg-foreground hover:text-background"
              >
                Download .md
              </Button>
              <Button
                type="button"
                disabled={!props.hasArticle || props.isSummarizing}
                onClick={() => void props.summarizeArticle()}
                className="h-10 rounded-none bg-primary px-6 font-bold uppercase tracking-wide text-primary-foreground hover:invert"
              >
                {props.isSummarizing ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Summarizing
                  </>
                ) : (
                  "Summarize"
                )}
              </Button>
            </div>
          </section>
        ) : null}

        {props.showEmptyState ? (
          <section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex min-h-0 flex-col space-y-3 border-2 border-foreground p-4 sm:space-y-4 sm:p-6"
              >
                <div className="text-4xl font-extrabold uppercase leading-none opacity-20 sm:text-5xl">
                  {step.num}
                </div>
                <div className="stitch-label inline-block w-fit bg-foreground px-2 text-background">
                  {step.tag}
                </div>
                <p className="text-sm leading-relaxed sm:text-base">{step.body}</p>
              </div>
            ))}
          </section>
        ) : null}

        {props.showWorkspace ? (
          <section className="border-2 border-foreground p-6">
            <WorkspacePanel {...props} />
          </section>
        ) : null}

        {props.hasSummary ? (
          <section className="border-2 border-foreground p-6">
            <ChatPanel {...props} />
          </section>
        ) : null}

        {props.showEmptyState ? (
          <div className="relative hidden min-h-[180px] w-full overflow-hidden sm:block lg:min-h-[300px]">
            <div className="absolute inset-0 flex items-center justify-center border-2 border-foreground">
              <div className="select-none text-[clamp(4rem,18vw,12rem)] font-black uppercase leading-none text-foreground opacity-5">
                XForge
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

type ArchiveViewProps = Pick<
  XForgeState,
  "history" | "currentArticleId" | "loadArticleFromHistory" | "clearHistory"
> & {
  onOpenDashboard: () => void
}

export function ArchiveView({
  history,
  currentArticleId,
  loadArticleFromHistory,
  clearHistory,
  onOpenDashboard,
}: ArchiveViewProps) {
  return (
    <div className="flex-1 py-6 stitch-margin sm:py-8 lg:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="border-b-2 border-foreground pb-8">
          <h1 className="stitch-display mb-4">Archive</h1>
          <p className="stitch-body-lg max-w-xl text-muted-foreground">
            Local extraction history stored in this browser.
          </p>
        </section>

        <div className="flex items-center justify-between gap-4">
          <span className="stitch-label text-muted-foreground">
            {history.length} entries
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={clearHistory}
            disabled={!history.length}
            className="rounded-none border-2 border-foreground bg-transparent uppercase"
          >
            Clear archive
          </Button>
        </div>

        <div className="space-y-3">
          {history.length ? (
            history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", year: "numeric" }
              )
              const isActive = item.id === currentArticleId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    loadArticleFromHistory(item.id)
                    onOpenDashboard()
                  }}
                  className={`w-full border-2 p-4 text-left transition-colors hover:border-primary ${
                    isActive ? "border-primary bg-muted/40" : "border-foreground"
                  }`}
                >
                  <div className="stitch-label mb-1 font-bold">{item.domain}</div>
                  <div className="mb-2 line-clamp-2 text-sm font-semibold">
                    {item.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{dateStr}</div>
                </button>
              )
            })
          ) : (
            <div className="border-2 border-dashed border-foreground/40 p-10 text-center text-sm text-muted-foreground">
              No archived articles yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type SystemViewProps = Pick<
  XForgeState,
  | "token"
  | "setToken"
  | "isLoggedIn"
  | "login"
  | "logout"
  | "isLoggingIn"
  | "accessTier"
> & {
  serviceStatus: ServiceStatus
  historyCount: number
}

export function SystemView({
  token,
  setToken,
  isLoggedIn,
  login,
  logout,
  isLoggingIn,
  accessTier,
  serviceStatus,
  historyCount,
}: SystemViewProps) {
  const archivePct = Math.min(Math.round((historyCount / 50) * 100), 100)

  return (
    <div className="flex-1 py-6 stitch-margin sm:py-8 lg:py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <section className="border-b-2 border-foreground pb-8">
          <h1 className="stitch-display mb-4">System</h1>
          <p className="stitch-body-lg text-muted-foreground">
            Service status, output format, and authentication for this XForge
            instance.
          </p>
        </section>

        <div className="space-y-4 border-2 border-foreground p-6">
          <div className="stitch-label text-muted-foreground">Service status</div>
          <p className="stitch-label flex items-center gap-2 text-muted-foreground">
            {serviceStatus.kind === "busy" ? (
              <Spinner className="size-3" />
            ) : (
              <Radio className="size-3.5" />
            )}
            {serviceStatus.label}
          </p>
          <div className="space-y-4 pt-2">
            <StatBar
              label="Saved articles"
              value={`${historyCount} in this browser`}
              pct={archivePct}
            />
          </div>
        </div>

        <div className="space-y-3 border-2 border-foreground p-6">
          <div className="stitch-label font-bold">Output format</div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Markdown with YAML frontmatter and a clean article body. Source URLs
            must be public X articles on x.com or twitter.com.
          </p>
        </div>

        <div className="space-y-4 border-2 border-foreground p-6">
          <div className="stitch-label text-muted-foreground">Access tier</div>
          <p className="text-2xl font-bold uppercase">
            {isLoggedIn ? "Private" : accessTier === "demo" ? "Standard" : "Standard"}
          </p>
          <p className="text-sm text-muted-foreground">
            Sign in with a private token for higher daily extraction limits.
          </p>

          {!isLoggedIn ? (
            <div className="space-y-3 pt-4">
              <label htmlFor="access-token" className="stitch-label">
                Private token
              </label>
              <div className="flex gap-0 border-2 border-foreground">
                <Input
                  id="access-token"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Paste your private token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  className="h-12 flex-1 rounded-none border-0 border-r-2 border-foreground bg-transparent focus-visible:ring-0"
                />
                <Button
                  type="button"
                  onClick={() => void login()}
                  disabled={isLoggingIn}
                  className="h-12 rounded-none bg-primary px-6 font-bold uppercase text-primary-foreground hover:invert"
                >
                  {isLoggingIn ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Checking
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-4">
              <span className="text-sm text-muted-foreground">Signed in.</span>
              <Button
                type="button"
                variant="outline"
                onClick={logout}
                className="rounded-none border-2 border-foreground bg-transparent uppercase"
              >
                <LogOut className="size-3.5" data-icon="inline-start" />
                Sign out
              </Button>
            </div>
          )}
        </div>

        <div className="border-2 border-foreground bg-foreground p-6 text-background">
          <div className="stitch-label font-black">Local workspace</div>
          <p className="mt-2 text-xs leading-relaxed opacity-80">
            History is stored in this browser only. Clear the archive from the
            Archive page when you need a fresh start.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatBar({
  label,
  value,
  pct,
}: {
  label: string
  value: string
  pct: number
}) {
  return (
    <div>
      <div className="stitch-label mb-1 flex justify-between opacity-60">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 w-full bg-foreground/10">
        <div
          className="h-full bg-primary transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
