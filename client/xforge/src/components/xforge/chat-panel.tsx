import { Send } from "lucide-react"

import type { ChatMessage } from "@/lib/types"
import type { XForgeState } from "@/hooks/use-xforge"
import { MarkdownLite } from "@/components/xforge/markdown-lite"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import * as React from "react"

const quickActions = [
  {
    label: "Compare claims",
    prompt: "Compare the main claims with the source article",
  },
  {
    label: "Implementation",
    prompt: "Show the practical implementation steps",
  },
  {
    label: "Verify",
    prompt: "List what I should verify before trusting this article",
  },
]

type ChatPanelProps = Pick<
  XForgeState,
  "chatMessages" | "sendChat" | "isChatting" | "hasSummary"
>

export function ChatPanel({
  chatMessages,
  sendChat,
  isChatting,
  hasSummary,
}: ChatPanelProps) {
  const [input, setInput] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    const node = scrollRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [chatMessages, isChatting])

  if (!hasSummary) return null

  async function handleSend() {
    const question = input.trim()
    if (!question) return
    setInput("")
    await sendChat(question)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="stitch-label mb-2 text-muted-foreground">Chat</p>
        <h2 className="stitch-headline-md font-bold uppercase">
          Ask about this article
        </h2>
      </div>

      <ScrollArea className="h-[min(40vh,20rem)] border-2 border-foreground">
        <div ref={scrollRef} className="flex flex-col gap-4 p-4">
          {chatMessages.map((message, index) => (
            <ChatBubble key={`${message.role}-${index}`} message={message} />
          ))}
          {isChatting ? <TypingBubble /> : null}
        </div>
      </ScrollArea>

      <div className="space-y-3">
        <div className="flex gap-0 border-2 border-foreground">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a follow-up question..."
            rows={2}
            className="min-h-12 flex-1 resize-none rounded-none border-0 bg-transparent px-4 py-3 focus-visible:ring-0"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void handleSend()
              }
            }}
          />
          <Button
            type="button"
            aria-label="Send message"
            disabled={!input.trim() || isChatting}
            onClick={() => void handleSend()}
            className="min-h-12 w-14 shrink-0 rounded-none bg-primary text-primary-foreground hover:invert"
          >
            {isChatting ? <Spinner /> : <Send className="size-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(action.prompt)
                textareaRef.current?.focus()
              }}
              className="rounded-none border-foreground bg-transparent uppercase"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse text-right")}>
      <div
        className={cn(
          "grid size-7 shrink-0 place-items-center border border-foreground text-[0.55rem] font-bold uppercase",
          isUser
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground"
        )}
      >
        {isUser ? "You" : "AI"}
      </div>
      <div
        className={cn(
          "max-w-[85%] border border-foreground px-3 py-2 text-sm",
          isUser ? "bg-primary/10" : "bg-muted/20"
        )}
      >
        <MarkdownLite content={message.content} />
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="grid size-7 shrink-0 place-items-center border border-foreground text-[0.55rem] font-bold uppercase text-muted-foreground">
        AI
      </div>
      <div className="flex items-center gap-1 border border-foreground px-3 py-3">
        <Skeleton className="size-1.5 rounded-none" />
        <Skeleton className="size-1.5 rounded-none" />
        <Skeleton className="size-1.5 rounded-none" />
      </div>
    </div>
  )
}
