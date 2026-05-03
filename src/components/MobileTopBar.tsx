import { Menu } from 'lucide-react'
import { useLocation, useMatch } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { Article } from '@/types'

interface MobileTopBarProps {
  articles: Article[]
  onOpenNav: () => void
}

const titleFor = (pathname: string): string => {
  if (pathname.startsWith('/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/history'))   return 'History'
  if (pathname.startsWith('/settings'))  return 'Settings'
  if (pathname.startsWith('/editor'))    return 'Editor'
  return 'Article Builder'
}

export function MobileTopBar({ articles, onOpenNav }: MobileTopBarProps) {
  const { pathname } = useLocation()
  const editorMatch = useMatch('/editor/:id')
  const editingArticle = editorMatch ? articles.find(a => a.id === editorMatch.params.id) : null

  // Editor route shows the article title in the bar; other routes show the
  // page name. The editor's own top bar handles per-article actions.
  const title = editingArticle ? editingArticle.title : titleFor(pathname)

  return (
    <header
      data-testid="mobile-topbar"
      className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-2 md:hidden"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open navigation"
        data-testid="mobile-nav-trigger"
        onClick={onOpenNav}
        className="h-9 w-9"
      >
        <Menu size={18} />
      </Button>
      <h1 className="min-w-0 flex-1 truncate font-serif text-base font-semibold tracking-tight">{title}</h1>
    </header>
  )
}
