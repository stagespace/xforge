import { renderMarkdownLite } from "@/lib/render"
import { cn } from "@/lib/utils"

type MarkdownLiteProps = {
  content: string
  className?: string
}

export function MarkdownLite({ content, className }: MarkdownLiteProps) {
  return (
    <div
      className={cn("markdown-lite text-sm leading-relaxed", className)}
      dangerouslySetInnerHTML={{ __html: renderMarkdownLite(content) }}
    />
  )
}
