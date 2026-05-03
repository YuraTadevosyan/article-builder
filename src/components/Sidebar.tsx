import { NavLink, useMatch } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Icon } from './Icon'
import { Kbd } from './ui/Kbd'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { fmtDate, cn } from '@/lib/utils'
import type { Article } from '@/types'

interface SidebarProps {
  articles: Article[]
  onNewArticle: () => void
  /**
   * Called when a nav link or article row is activated. Used by the mobile
   * sheet to dismiss itself; on desktop the sidebar is always visible so
   * this is a no-op.
   */
  onNavigate?: () => void
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'doc',     testId: 'nav-dashboard' },
  { to: '/editor',    label: 'Editor',    icon: 'edit',    testId: 'nav-editor', match: '/editor/*' },
  { to: '/history',   label: 'History',   icon: 'history', testId: 'nav-history' },
  { to: '/settings',  label: 'Settings',  icon: 'settings', testId: 'nav-settings' },
] as const

export function Sidebar({ articles, onNewArticle, onNavigate }: SidebarProps) {
  const drafts = articles.filter(a => a.status === 'Draft')
  const published = articles.filter(a => a.status === 'Published')
  const editorMatch = useMatch('/editor/:id')
  const currentId = editorMatch?.params.id ?? null

  return (
    <aside
      data-testid="sidebar"
      aria-label="Workspace navigation"
      className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-background"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background shadow-[var(--shadow-sm)]" aria-hidden="true">
          <div className="h-2.5 w-2.5 rounded-sm bg-accent" />
          <div className="pointer-events-none absolute inset-0 translate-x-[2px] translate-y-[2px] rounded-md border border-accent/60" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Article Builder</span>
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground">v0.6 · LOCAL</span>
        </div>
      </div>

      {/* New article */}
      <div className="border-b border-border p-3">
        <Button
          onClick={onNewArticle}
          size="lg"
          className="w-full justify-start gap-2 text-sm"
          data-testid="new-article-btn"
        >
          <Plus size={14} aria-hidden="true" />
          New article
          <span className="flex-1" />
          <Kbd>⌘N</Kbd>
        </Button>
      </div>

      {/* Navigation */}
      <nav aria-label="Workspace" className="px-2 pt-3">
        <div className="label px-2 pb-1.5">Workspace</div>
        {navItems.map(n => (
          <SidebarNavLink key={n.to} {...n} onNavigate={onNavigate} />
        ))}
      </nav>

      <Separator className="mt-3" />

      {/* Article list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pt-3">
        <div className="label flex items-center justify-between px-2 pb-2">
          <span>Drafts</span>
          <span className="text-muted-foreground">{drafts.length}</span>
        </div>
        {drafts.length === 0 && (
          <div className="px-2.5 pb-3 text-xs text-muted-foreground">No drafts yet.</div>
        )}
        {drafts.map(a => (
          <SidebarArticle key={a.id} article={a} active={currentId === a.id} onNavigate={onNavigate} />
        ))}

        <div className="label mt-4 flex items-center justify-between px-2 pb-2">
          <span>Published</span>
          <span className="text-muted-foreground">{published.length}</span>
        </div>
        {published.length === 0 && (
          <div className="px-2.5 pb-3 text-xs text-muted-foreground">Nothing published.</div>
        )}
        {published.map(a => (
          <SidebarArticle key={a.id} article={a} active={currentId === a.id} onNavigate={onNavigate} />
        ))}
        <div className="h-3" />
      </div>
    </aside>
  )
}

interface SidebarNavLinkProps {
  to: string
  label: string
  icon: string
  testId: string
  match?: string
  onNavigate?: () => void
}

function SidebarNavLink({ to, label, icon, testId, match, onNavigate }: SidebarNavLinkProps) {
  const editorMatch = useMatch(match ?? '___never___')
  return (
    <NavLink
      to={to}
      data-testid={testId}
      onClick={() => onNavigate?.()}
      className={({ isActive }) => {
        const active = isActive || (match && editorMatch)
        return cn(
          'group relative mb-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all min-h-[40px]',
          active
            ? 'bg-accent-soft text-accent-ink font-medium shadow-[var(--shadow-sm)]'
            : 'text-foreground/85 hover:bg-secondary hover:text-foreground'
        )
      }}
      end={to === '/editor' ? false : true}
    >
      {({ isActive }) => {
        const active = isActive || (match && editorMatch)
        return (
          <>
            <Icon name={icon} size={16} />
            <span className="flex-1">{label}</span>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />}
          </>
        )
      }}
    </NavLink>
  )
}

function SidebarArticle({ article, active, onNavigate }: { article: Article; active: boolean; onNavigate?: () => void }) {
  return (
    <NavLink
      to={`/editor/${article.id}`}
      data-testid={`article-item-${article.id}`}
      onClick={() => onNavigate?.()}
      className={cn(
        'mb-0.5 flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-all min-h-[40px]',
        active
          ? 'bg-accent-soft text-accent-ink shadow-[var(--shadow-sm)]'
          : 'hover:bg-secondary'
      )}
    >
      <div className={cn('flex-1 truncate text-[13px] leading-snug', active ? 'text-accent-ink font-medium' : 'text-foreground/85')}>
        {article.title}
      </div>
      <span className="mono shrink-0 pt-0.5 text-[10px] text-muted-foreground">{fmtDate(article.updatedAt)}</span>
    </NavLink>
  )
}
