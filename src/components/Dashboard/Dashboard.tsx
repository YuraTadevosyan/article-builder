import { useState, useMemo } from 'react'
import { Icon } from '../Icon'
import { Kbd } from '../ui/Kbd'
import { Tag } from '../ui/Tag'
import { Status } from '../ui/Status'
import { CoverPh } from '../ui/CoverPh'
import { Menu } from '../ui/Menu'
import { fmtDate, cn } from '@/lib/utils'
import type { Article } from '@/types'

interface DashboardProps {
  articles: Article[]
  onPick: (id: string) => void
  onNew: () => void
  onUpdate: (id: string, patch: Partial<Article>) => void
  onDelete: (id: string) => void
}

type SortKey = 'updated' | 'created' | 'title' | 'words'

function sortLabel(s: SortKey): string {
  return { updated: 'Updated', created: 'Created', title: 'Title', words: 'Words' }[s]
}

export function Dashboard({ articles, onPick, onNew, onUpdate, onDelete }: DashboardProps) {
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('updated')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const allTags = useMemo(() => {
    const s = new Set<string>()
    articles.forEach(a => (a.tags || []).forEach(t => s.add(t)))
    return Array.from(s)
  }, [articles])

  const filtered = useMemo(() => {
    let list = articles.filter(a => {
      if (statusFilter !== 'all' && a.status.toLowerCase() !== statusFilter) return false
      if (tagFilter && !(a.tags || []).includes(tagFilter)) return false
      if (query && !(a.title + ' ' + a.description).toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
    if (sort === 'updated') list = [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    else if (sort === 'created') list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else if (sort === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'words') list = [...list].sort((a, b) => b.words - a.words)
    return list
  }, [articles, query, tagFilter, statusFilter, sort])

  const stats = {
    total: articles.length,
    drafts: articles.filter(a => a.status === 'Draft').length,
    published: articles.filter(a => a.status === 'Published').length,
    words: articles.reduce((s, a) => s + (a.words || 0), 0),
  }

  return (
    <div data-testid="dashboard" className="h-full flex-1 overflow-auto">
      {/* Header */}
      <div className="mx-auto max-w-[1280px] px-4 pt-6 md:px-10 md:pt-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label mb-1.5">Workspace</div>
            <h1 className="m-0 font-serif text-2xl font-bold leading-tight tracking-tight md:text-4xl">
              All articles
            </h1>
          </div>
          <button
            onClick={onNew}
            data-testid="new-article-btn"
            className="inline-flex h-10 items-center gap-2 self-start border border-primary bg-primary px-3 font-mono text-xs text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:self-auto"
          >
            <Icon name="plus" size={14} aria-hidden="true" />
            New article
            <Kbd>⌘N</Kbd>
          </button>
        </div>

        {/* Stats — 2 cols on mobile, 4 cols on md+ */}
        <div className="mb-5 grid grid-cols-2 border border-border md:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, accent: false },
            { label: 'Drafts', value: stats.drafts, accent: true },
            { label: 'Published', value: stats.published, accent: false },
            { label: 'Words written', value: stats.words.toLocaleString(), accent: false },
          ].map((s, i) => (
            <div
              key={s.label}
              className={cn(
                'p-3 md:px-4 md:py-3.5',
                // Vertical rule between cells in 2-col mobile and 4-col desktop
                i % 2 === 0 && 'border-r border-border md:border-r',
                i < 2 && 'border-b border-border md:border-b-0',
                (i === 1 || i === 3) && 'md:border-r-0',
                i === 1 && 'md:border-r md:border-r-border',
              )}
            >
              <div className="label">{s.label}</div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-serif text-2xl font-semibold tracking-tight md:text-[28px]">{s.value}</span>
                {s.accent && <span className="h-1.5 w-1.5 bg-accent" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters toolbar — wraps to multiple rows on small screens */}
      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
          <div className="relative w-full sm:w-[280px]">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
              aria-label="Search articles"
              data-testid="search-input"
              className="h-9 w-full border border-border bg-transparent pl-8 pr-9 font-mono text-xs text-foreground transition-colors focus-visible:border-foreground"
            />
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
              <Icon name="search" size={13} />
            </span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2"><Kbd>⌘F</Kbd></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="label">Status</span>
            <div className="flex border border-border" role="group" aria-label="Filter by status">
              {(['all', 'draft', 'published'] as const).map((s, i, arr) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  data-testid={`filter-${s}`}
                  aria-pressed={statusFilter === s}
                  className={cn(
                    'h-8 px-2.5 font-mono text-[11px] capitalize transition-colors',
                    i < arr.length - 1 && 'border-r border-r-border',
                    statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground/85 hover:bg-secondary',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <span className="hidden flex-1 sm:block" />

          <div className="flex items-center gap-2">
            <span className="label">Sort</span>
            <Menu
              trigger={
                <button
                  aria-label="Sort articles"
                  className="inline-flex h-8 items-center gap-1.5 border border-border bg-card px-2.5 font-mono text-[11px] text-foreground/85 transition-colors hover:border-foreground hover:text-foreground"
                >
                  <Icon name="sort" size={12} />
                  {sortLabel(sort)}
                  <Icon name="chevron-down" size={11} />
                </button>
              }
              items={[
                { label: 'Last updated', icon: 'history', onClick: () => setSort('updated') },
                { label: 'Date created', icon: 'doc', onClick: () => setSort('created') },
                { label: 'Title (A–Z)', icon: 'edit', onClick: () => setSort('title') },
                { label: 'Word count', icon: 'summary', onClick: () => setSort('words') },
              ]}
            />

            <div className="flex border border-border" role="group" aria-label="View mode">
              {[{ id: 'grid' as const, icon: 'doc', label: 'Grid' }, { id: 'list' as const, icon: 'ul', label: 'List' }].map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  data-testid={`view-${v.id}`}
                  aria-label={v.label}
                  aria-pressed={view === v.id}
                  className={cn(
                    'flex h-8 w-9 items-center justify-center transition-colors',
                    i === 0 && 'border-r border-r-border',
                    view === v.id ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground/85 hover:bg-secondary',
                  )}
                >
                  <Icon name={v.icon} size={12} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 py-3">
          <span className="label">Tags</span>
          <Tag label="all" active={tagFilter === null} onClick={() => setTagFilter(null)} />
          {allTags.map(t => (
            <Tag key={t} label={t} active={tagFilter === t} onClick={() => setTagFilter(tagFilter === t ? null : t)} />
          ))}
        </div>
      </div>

      {/* Articles grid/list */}
      <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-4 md:px-10">
        {filtered.length === 0 ? (
          <EmptyState onNew={onNew} hasQuery={!!query} />
        ) : view === 'grid' ? (
          <div className="list-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {filtered.map(a => (
              <ArticleCard
                key={a.id}
                article={a}
                onClick={() => onPick(a.id)}
                onTogglePublish={() => onUpdate(a.id, { status: a.status === 'Published' ? 'Draft' : 'Published', updatedAt: new Date().toISOString() })}
                onDelete={() => onDelete(a.id)}
              />
            ))}
          </div>
        ) : (
          <ArticleList articles={filtered} onPick={onPick} onDelete={onDelete} />
        )}
      </div>
    </div>
  )
}

function ArticleCard({ article, onClick, onTogglePublish, onDelete }: { article: Article; onClick: () => void; onTogglePublish: () => void; onDelete: () => void }) {
  return (
    <div
      onClick={onClick}
      data-testid={`article-card-${article.id}`}
      className="lift-hover flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-sm)]"
    >
      <CoverPh kind={article.cover} height={120} />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <Status value={article.status} />
          <span className="flex-1" />
          <span className="mono text-[10px] text-muted-foreground">{article.id}</span>
          <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex' }}>
            <Menu
              align="right"
              trigger={
                <button
                  aria-label={`More actions for ${article.title}`}
                  title="More"
                  data-testid={`article-card-menu-${article.id}`}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Icon name="more" size={14} />
                </button>
              }
              items={[
                { label: article.status === 'Published' ? 'Unpublish' : 'Publish', icon: 'check', onClick: onTogglePublish },
                { divider: true },
                { label: 'Delete', icon: 'trash', danger: true, onClick: onDelete },
              ]}
            />
          </span>
        </div>
        <div className="mb-1.5 font-serif text-lg font-semibold leading-tight tracking-tight text-foreground">
          {article.title}
        </div>
        <div className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-foreground/75">
          {article.description}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-3">
          {(article.tags || []).slice(0, 2).map(t => <Tag key={t} label={t} />)}
          <span className="flex-1" />
          <span className="mono text-[10px] text-muted-foreground">{article.words}w · {fmtDate(article.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}

function ArticleList({ articles, onPick, onDelete }: { articles: Article[]; onPick: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-sm)]">
      <div className="grid grid-cols-[auto_1fr_140px_120px_100px_28px] gap-3 border-b border-border bg-secondary px-4 py-2">
        {['', 'Title', 'Tags', 'Status', 'Updated', ''].map((h, i) => (
          <div key={i} className="label">{h}</div>
        ))}
      </div>
      <div className="list-stagger">
      {articles.map(a => (
        <div
          key={a.id}
          onClick={() => onPick(a.id)}
          data-testid={`article-list-item-${a.id}`}
          className="grid cursor-pointer grid-cols-[auto_1fr_140px_120px_100px_28px] items-center gap-3 border-b border-[var(--rule-softer)] px-4 py-2.5 transition-colors last:border-b-0 hover:bg-secondary"
        >
          <div className="h-7 w-7 overflow-hidden rounded-md border border-border bg-secondary">
            <CoverPh kind={a.cover} height={22} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{a.title}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(a.tags || []).slice(0, 2).map(t => <Tag key={t} label={t} />)}
          </div>
          <Status value={a.status} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{fmtDate(a.updatedAt)}</span>
          <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Menu
              align="right"
              trigger={
                <button
                  aria-label={`More actions for ${a.title}`}
                  title="More"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Icon name="more" size={14} />
                </button>
              }
              items={[
                { label: 'Delete', icon: 'trash', danger: true, onClick: () => onDelete(a.id) },
              ]}
            />
          </span>
        </div>
      ))}
      </div>
    </div>
  )
}

function EmptyState({ onNew, hasQuery }: { onNew: () => void; hasQuery: boolean }) {
  return (
    <div className="fade-up flex flex-col items-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
        <Icon name="doc" size={20} />
      </div>
      <div className="mb-1.5 font-serif text-xl font-semibold">
        {hasQuery ? 'No matches' : 'No articles yet'}
      </div>
      <div className="mb-5 text-sm text-foreground/70">
        {hasQuery ? 'Try a different search or clear filters.' : 'Start your first article — autosaved as you type.'}
      </div>
      {!hasQuery && (
        <button
          onClick={onNew}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 font-mono text-xs text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--shadow-sm)]"
        >
          <Icon name="plus" size={14} />Create article
        </button>
      )}
    </div>
  )
}
