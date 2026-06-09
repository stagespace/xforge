type MainHeaderProps = {
  onOpenNav?: () => void
}

export function MainHeader({ onOpenNav }: MainHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between gap-3 border-b-2 border-foreground bg-background py-3 stitch-margin lg:py-4">
      <div className="flex min-w-0 items-center gap-3">
        {onOpenNav ? (
          <button
            type="button"
            onClick={onOpenNav}
            className="flex size-9 shrink-0 items-center justify-center border-2 border-foreground lg:hidden"
            aria-label="Open navigation"
          >
            <span className="stitch-label">Menu</span>
          </button>
        ) : null}
        <div className="stitch-headline-md min-w-0 truncate font-bold uppercase tracking-tight text-sm sm:text-base md:text-2xl">
          XForge Article Extractor
        </div>
      </div>
    </header>
  )
}
