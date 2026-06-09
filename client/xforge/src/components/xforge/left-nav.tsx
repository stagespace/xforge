import { cn } from "@/lib/utils"

export type SwissNavId = "dashboard" | "archive" | "system"

const navItems: { id: SwissNavId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "archive", label: "Archive" },
  { id: "system", label: "System" },
]

type NavContentProps = {
  active: SwissNavId
  onChange: (id: SwissNavId) => void
  onNewExtraction: () => void
  onNavigate?: () => void
  className?: string
}

export function NavContent({
  active,
  onChange,
  onNewExtraction,
  onNavigate,
  className,
}: NavContentProps) {
  return (
    <div className={cn("flex h-full flex-col bg-background pt-8", className)}>
      <div className="mb-8 px-6 lg:mb-12">
        <div className="stitch-headline-md font-black uppercase">XForge</div>
        <div className="stitch-label mt-1 text-muted-foreground opacity-60">
          V0.0.1
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(({ id, label }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onChange(id)
                onNavigate?.()
              }}
              className={cn(
                "group flex w-full items-center px-6 py-2.5 transition-all duration-75",
                isActive
                  ? "bg-primary font-bold text-primary-foreground"
                  : "text-muted-foreground hover:border-2 hover:border-primary"
              )}
            >
              <span className="stitch-label text-sm">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4">
        <button
          type="button"
          onClick={() => {
            onNewExtraction()
            onNavigate?.()
          }}
          className="w-full border-2 border-transparent bg-primary py-4 font-bold uppercase tracking-tighter text-primary-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          New extraction
        </button>
      </div>
    </div>
  )
}

type LeftNavProps = NavContentProps

export function LeftNav(props: LeftNavProps) {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col border-r-2 border-foreground bg-background lg:flex">
      <NavContent {...props} className="w-full" />
    </aside>
  )
}
