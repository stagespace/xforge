import { Copy, FileText, Sparkles, BarChart3 } from "lucide-react"
import * as React from "react"

import type { HistoryItem } from "@/lib/types"
import { parseSummary } from "@/lib/summary"
import type { XForgeState } from "@/hooks/use-xforge"
import { MarkdownLite } from "@/components/xforge/markdown-lite"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { renderInline } from "@/lib/render"

type WorkspacePanelProps = Pick<
  XForgeState,
  | "currentSummary"
  | "currentMarkdown"
  | "activeTab"
  | "setActiveTab"
  | "copyMarkdown"
  | "copyState"
  | "author"
  | "publishedDate"
  | "metrics"
>

function SummaryGrid({
  items,
  emptyLabel,
}: {
  items: { label: string; value: string }[]
  emptyLabel: string
}) {
  const rows = items.length
    ? items
    : [{ label: "No items returned", value: emptyLabel }]

  return (
    <div className="flex flex-col">
      {rows.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="flex flex-col gap-1 border-b border-foreground/30 py-3 last:border-0"
        >
          <span
            className="stitch-label text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: renderInline(item.label) }}
          />
          <span
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderInline(item.value) }}
          />
        </div>
      ))}
    </div>
  )
}

export function WorkspacePanel({
  currentSummary,
  currentMarkdown,
  activeTab,
  setActiveTab,
  copyMarkdown,
  copyState,
  author,
  publishedDate,
  metrics,
}: WorkspacePanelProps) {
  const sections = parseSummary(currentSummary)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-0 border-b-2 border-foreground bg-transparent p-0"
      >
        <TabsTrigger
          value="dashboard"
          className="rounded-none px-4 py-3 uppercase tracking-wide data-active:border-b-2 data-active:border-primary"
        >
          <Sparkles className="size-3.5" />
          Summary
        </TabsTrigger>
        <TabsTrigger
          value="markdown"
          className="rounded-none px-4 py-3 uppercase tracking-wide data-active:border-b-2 data-active:border-primary"
        >
          <FileText className="size-3.5" />
          Markdown
        </TabsTrigger>
        <TabsTrigger
          value="metadata"
          className="rounded-none px-4 py-3 uppercase tracking-wide data-active:border-b-2 data-active:border-primary"
        >
          <BarChart3 className="size-3.5" />
          Metrics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-4">
        <PosterBlock title="TL;DR">
          <MarkdownLite content={sections.tldr || "No TL;DR returned."} />
        </PosterBlock>
        <div className="grid gap-4 lg:grid-cols-2">
          <PosterBlock title="Key Points">
            <SummaryGrid
              items={sections.keyPoints}
              emptyLabel="Run the summary again or ask in chat."
            />
          </PosterBlock>
          <PosterBlock title="Claims To Verify">
            <SummaryGrid
              items={sections.claims}
              emptyLabel="Run the summary again or ask in chat."
            />
          </PosterBlock>
        </div>
        <PosterBlock title="Practical Takeaways">
          <SummaryGrid
            items={sections.takeaways}
            emptyLabel="Run the summary again or ask in chat."
          />
        </PosterBlock>
      </TabsContent>

      <TabsContent value="markdown">
        <PosterBlock
          title="Note-ready markdown"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyMarkdown()}
              className="rounded-none border-foreground bg-transparent uppercase"
            >
              <Copy className="size-3.5" data-icon="inline-start" />
              {copyState === "copied" ? "Copied" : "Copy"}
            </Button>
          }
        >
          <ScrollArea className="h-[min(50vh,24rem)] border-2 border-foreground">
            <Textarea
              readOnly
              value={currentMarkdown}
              className="min-h-[min(50vh,24rem)] resize-none border-0 bg-transparent font-mono text-xs focus-visible:ring-0"
            />
          </ScrollArea>
        </PosterBlock>
      </TabsContent>

      <TabsContent value="metadata">
        <PosterBlock title="Extraction metrics">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricItem label="Author" value={author || "Not detected"} />
            <MetricItem
              label="Published"
              value={publishedDate || "Not detected"}
            />
            <MetricItem
              label="Original length"
              value={
                metrics ? `${metrics.rawLength.toLocaleString()} chars` : "—"
              }
            />
            <MetricItem
              label="Cleaned length"
              value={
                metrics ? `${metrics.cleanedLength.toLocaleString()} chars` : "—"
              }
            />
            <MetricItem label="Noise removed" value={formatSaved(metrics)} />
            <MetricItem
              label="Lines stripped"
              value={metrics ? String(metrics.removedLineCount) : "—"}
            />
          </div>
        </PosterBlock>
      </TabsContent>
    </Tabs>
  )
}

function PosterBlock({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border-2 border-foreground p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="stitch-label font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-foreground/30 p-3">
      <span className="stitch-label text-muted-foreground">{label}</span>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function formatSaved(metrics: HistoryItem["metrics"] | null) {
  if (!metrics) return "—"
  const saved = metrics.rawLength - metrics.cleanedLength
  const pct = Math.round((saved / (metrics.rawLength || 1)) * 100)
  return `${saved.toLocaleString()} chars (${pct}%)`
}
