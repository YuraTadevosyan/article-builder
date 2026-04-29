import { Icon } from './Icon'
import { Kbd } from './ui/Kbd'
import { fmtDate } from '../lib/utils'
import type { Article, Route } from '../types'

interface SidebarProps {
  route: Route
  onRoute: (r: Route) => void
  articles: Article[]
  currentId: string | null
  onPickArticle: (id: string) => void
  onNewArticle: () => void
}

const navItems = [
  { id: 'dashboard' as Route, label: 'Dashboard', icon: 'doc' },
  { id: 'editor' as Route, label: 'Editor', icon: 'edit' },
  { id: 'history' as Route, label: 'History', icon: 'history' },
  { id: 'settings' as Route, label: 'Settings', icon: 'settings' },
]

export function Sidebar({ route, onRoute, articles, currentId, onPickArticle, onNewArticle }: SidebarProps) {
  const drafts = articles.filter(a => a.status === 'Draft')
  const published = articles.filter(a => a.status === 'Published')

  return (
    <aside
      data-testid="sidebar"
      style={{
        width: 232,
        flexShrink: 0,
        background: 'var(--paper)',
        borderRight: '1px solid var(--rule-soft)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 22, height: 22, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--paper)', flexShrink: 0, position: 'relative' }}>
          <div style={{ width: 8, height: 8, background: 'var(--accent)' }} />
          <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--accent)', transform: 'translate(2px, 2px)', pointerEvents: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>Article Builder</span>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>v0.4 · LOCAL</span>
        </div>
      </div>

      {/* New article */}
      <div style={{ padding: 12, borderBottom: '1px solid var(--rule-soft)' }}>
        <button
          onClick={onNewArticle}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', height: 32 }}
          data-testid="new-article-btn"
        >
          <Icon name="plus" size={12} />
          New article
          <span style={{ flex: 1 }} />
          <Kbd>⌘N</Kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px 8px 4px' }}>
        <div className="label" style={{ padding: '6px 8px 4px' }}>Workspace</div>
        {navItems.map(n => {
          const active = route === n.id
          return (
            <button
              key={n.id}
              onClick={() => onRoute(n.id)}
              data-testid={`nav-${n.id}`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 8px',
                background: active ? 'var(--paper-2)' : 'transparent',
                border: 0,
                borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer',
                color: active ? 'var(--ink)' : 'var(--ink-2)',
                fontSize: 13,
                fontFamily: 'var(--sans)',
                textAlign: 'left',
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon name={n.icon} size={14} />
              <span style={{ flex: 1 }}>{n.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Article list */}
      <div style={{ borderTop: '1px solid var(--rule-soft)', marginTop: 8, padding: '8px 8px 0', flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div className="label" style={{ padding: '6px 8px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Drafts</span>
          <span style={{ color: 'var(--ink-4)' }}>{drafts.length}</span>
        </div>
        {drafts.length === 0 && (
          <div style={{ padding: '4px 10px 8px', fontSize: 11, color: 'var(--ink-4)' }}>No drafts yet.</div>
        )}
        {drafts.map(a => (
          <SidebarArticle key={a.id} article={a} active={currentId === a.id && route === 'editor'} onClick={() => onPickArticle(a.id)} />
        ))}

        <div className="label" style={{ padding: '12px 8px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Published</span>
          <span style={{ color: 'var(--ink-4)' }}>{published.length}</span>
        </div>
        {published.length === 0 && (
          <div style={{ padding: '4px 10px 8px', fontSize: 11, color: 'var(--ink-4)' }}>Nothing published.</div>
        )}
        {published.map(a => (
          <SidebarArticle key={a.id} article={a} active={currentId === a.id && route === 'editor'} onClick={() => onPickArticle(a.id)} />
        ))}
        <div style={{ height: 12 }} />
      </div>
    </aside>
  )
}

function SidebarArticle({ article, active, onClick }: { article: Article; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`article-item-${article.id}`}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '6px 8px',
        background: active ? 'var(--paper-2)' : 'transparent',
        border: 0,
        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--ink-2)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--paper-2)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ fontSize: 12, lineHeight: 1.35, color: active ? 'var(--ink)' : 'var(--ink-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {article.title}
      </div>
      <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', flexShrink: 0, paddingTop: 2 }}>{fmtDate(article.updatedAt)}</span>
    </button>
  )
}
