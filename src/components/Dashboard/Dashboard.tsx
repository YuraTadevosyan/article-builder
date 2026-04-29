import { useState, useMemo } from 'react'
import { Icon } from '../Icon'
import { Kbd } from '../ui/Kbd'
import { Tag } from '../ui/Tag'
import { Status } from '../ui/Status'
import { CoverPh } from '../ui/CoverPh'
import { Menu } from '../ui/Menu'
import { fmtDate } from '../../lib/utils'
import type { Article } from '../../types'

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
    <div data-testid="dashboard" style={{ flex: 1, overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '32px 40px 0', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Workspace</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
              All articles
            </h1>
          </div>
          <button className="btn btn-primary" onClick={onNew} style={{ height: 32, padding: '0 12px' }} data-testid="new-article-btn">
            <Icon name="plus" size={12} />
            New article
            <Kbd>⌘N</Kbd>
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--rule-soft)', marginBottom: 20 }}>
          {[
            { label: 'Total', value: stats.total, accent: false },
            { label: 'Drafts', value: stats.drafts, accent: true },
            { label: 'Published', value: stats.published, accent: false },
            { label: 'Words written', value: stats.words.toLocaleString(), accent: false },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--rule-soft)' : 0 }}>
              <div className="label">{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>{s.value}</span>
                {s.accent && <span style={{ width: 6, height: 6, background: 'var(--accent)' }} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters toolbar */}
      <div style={{ padding: '0 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: '1px solid var(--rule-soft)', borderBottom: '1px solid var(--rule-soft)' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
              style={{ paddingLeft: 28, paddingRight: 36, fontFamily: 'var(--mono)', fontSize: 11 }}
              data-testid="search-input"
            />
            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', display: 'flex' }}>
              <Icon name="search" size={12} />
            </span>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
              <Kbd>⌘F</Kbd>
            </span>
          </div>

          <span style={{ width: 1, height: 16, background: 'var(--rule-soft)' }} />
          <span className="label">Status</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'draft', 'published'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className="btn" data-active={statusFilter === s} style={{ height: 24, padding: '0 8px', fontSize: 10, textTransform: 'capitalize' }} data-testid={`filter-${s}`}>
                {s}
              </button>
            ))}
          </div>

          <span style={{ flex: 1 }} />

          <span className="label">Sort</span>
          <Menu
            trigger={
              <button className="btn" style={{ height: 24 }}>
                <Icon name="sort" size={11} />{sortLabel(sort)}<Icon name="chevron-down" size={10} />
              </button>
            }
            items={[
              { label: 'Last updated', icon: 'history', onClick: () => setSort('updated') },
              { label: 'Date created', icon: 'doc', onClick: () => setSort('created') },
              { label: 'Title (A–Z)', icon: 'edit', onClick: () => setSort('title') },
              { label: 'Word count', icon: 'summary', onClick: () => setSort('words') },
            ]}
          />

          <div style={{ display: 'flex', border: '1px solid var(--rule-soft)' }}>
            {[{ id: 'grid' as const, icon: 'doc' }, { id: 'list' as const, icon: 'ul' }].map((v, i) => (
              <button key={v.id} onClick={() => setView(v.id)} data-testid={`view-${v.id}`} style={{
                width: 26, height: 24, border: 0,
                borderRight: i === 0 ? '1px solid var(--rule-soft)' : 0,
                background: view === v.id ? 'var(--ink)' : 'transparent',
                color: view === v.id ? 'var(--paper)' : 'var(--ink-2)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={v.icon} size={11} />
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', flexWrap: 'wrap' }}>
          <span className="label">Tags</span>
          <Tag label="all" active={tagFilter === null} onClick={() => setTagFilter(null)} />
          {allTags.map(t => (
            <Tag key={t} label={t} active={tagFilter === t} onClick={() => setTagFilter(tagFilter === t ? null : t)} />
          ))}
        </div>
      </div>

      {/* Articles grid/list */}
      <div style={{ padding: '16px 40px 60px', maxWidth: 1280, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <EmptyState onNew={onNew} hasQuery={!!query} />
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
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
      style={{
        background: 'var(--card)',
        border: '1px solid var(--rule-soft)',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 120ms',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ink)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--rule-soft)')}
    >
      <CoverPh kind={article.cover} height={110} />
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Status value={article.status} />
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{article.id}</span>
          <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex' }}>
            <Menu
              align="right"
              trigger={
                <button title="More" data-testid={`article-card-menu-${article.id}`} style={{ width: 18, height: 18, border: 0, background: 'transparent', color: 'var(--ink-4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Icon name="more" size={12} />
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
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.01em', marginBottom: 6, color: 'var(--ink)' }}>
          {article.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, marginTop: 'auto', borderTop: '1px dashed var(--rule-soft)', flexWrap: 'wrap' }}>
          {(article.tags || []).slice(0, 2).map(t => <Tag key={t} label={t} />)}
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{article.words}w · {fmtDate(article.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}

function ArticleList({ articles, onPick, onDelete }: { articles: Article[]; onPick: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div style={{ border: '1px solid var(--rule-soft)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 140px 120px 100px 28px', gap: 12, padding: '8px 14px', background: 'var(--paper-2)', borderBottom: '1px solid var(--rule-soft)' }}>
        {['', 'Title', 'Tags', 'Status', 'Updated', ''].map((h, i) => (
          <div key={i} className="label">{h}</div>
        ))}
      </div>
      {articles.map(a => (
        <div
          key={a.id}
          onClick={() => onPick(a.id)}
          data-testid={`article-list-item-${a.id}`}
          style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 140px 120px 100px 28px', gap: 12, alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--rule-softer)', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: 24, height: 24, background: 'var(--paper-2)', border: '1px solid var(--rule-soft)' }}>
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
                <button title="More" style={{ width: 22, height: 22, border: 0, background: 'transparent', color: 'var(--ink-4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Icon name="more" size={12} />
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
  )
}

function EmptyState({ onNew, hasQuery }: { onNew: () => void; hasQuery: boolean }) {
  return (
    <div style={{ padding: 60, textAlign: 'center', border: '1px dashed var(--rule-soft)' }}>
      <div style={{ width: 36, height: 36, margin: '0 auto 14px', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
        <Icon name="doc" size={18} />
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
        {hasQuery ? 'No matches' : 'No articles yet'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
        {hasQuery ? 'Try a different search or clear filters.' : 'Start your first article — autosaved as you type.'}
      </div>
      {!hasQuery && <button className="btn btn-primary" onClick={onNew}><Icon name="plus" size={12} />Create article</button>}
    </div>
  )
}
