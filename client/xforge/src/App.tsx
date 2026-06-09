import * as React from "react"

import {
  ArchiveView,
  ExtractorView,
  SystemView,
} from "@/components/xforge/extractor-view"
import {
  LeftNav,
  NavContent,
  type SwissNavId,
} from "@/components/xforge/left-nav"
import { MainHeader } from "@/components/xforge/main-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useXForge } from "@/hooks/use-xforge"

export function App() {
  const xforge = useXForge()
  const [nav, setNav] = React.useState<SwissNavId>("dashboard")
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  function handleNewExtraction() {
    xforge.startNewExtraction()
    setNav("dashboard")
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-svh w-full bg-background">
        <LeftNav
          active={nav}
          onChange={setNav}
          onNewExtraction={handleNewExtraction}
        />

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-[min(100vw,16rem)] border-r-2 border-foreground p-0"
            showCloseButton
          >
            <NavContent
              active={nav}
              onChange={setNav}
              onNewExtraction={handleNewExtraction}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <main className="flex min-h-svh min-w-0 flex-1 flex-col overflow-y-auto lg:ml-64">
          <MainHeader onOpenNav={() => setMobileNavOpen(true)} />

          {nav === "archive" ? (
            <ArchiveView
              history={xforge.history}
              currentArticleId={xforge.currentArticleId}
              loadArticleFromHistory={xforge.loadArticleFromHistory}
              clearHistory={xforge.clearHistory}
              onOpenDashboard={() => setNav("dashboard")}
            />
          ) : nav === "system" ? (
            <SystemView
              token={xforge.token}
              setToken={xforge.setToken}
              isLoggedIn={xforge.isLoggedIn}
              login={xforge.login}
              logout={xforge.logout}
              isLoggingIn={xforge.isLoggingIn}
              accessTier={xforge.accessTier}
              serviceStatus={xforge.serviceStatus}
              historyCount={xforge.history.length}
            />
          ) : (
            <ExtractorView
              {...xforge}
              showWorkspace={xforge.showWorkspace}
              showEmptyState={xforge.showEmptyState}
            />
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
