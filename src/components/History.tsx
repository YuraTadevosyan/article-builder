import { useState, useMemo } from 'react'
import { Icon } from './Icon'
import { RenderBlock } from './Editor/RenderBlock'
import { fmtDate, fmtDateLong, cn } from '@/lib/utils'
import type { Article, Version } from '@/types'

interface HistoryProps {
  versions: Version[]
  articles: Article[]
  onRestore: (v: Version) => void
}

type Filter = 'all' | 'today' | 'week'

function withinFilter(at: string, filter: Filter): boolean {
  if (filter === 'all') return true
  const t = new Date(at).getTime()
  const now = Date.now()
  if (filter === 'today') return now - t < 24 * 60 * 60 * 1000
  return now - t < 7 * 24 * 60 * 60 * 1000
}

export function History({ versions, articles, onRestore }: HistoryProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const sorted = useMemo(() =>
    [...versions].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [versions]
  )
  const visible = useMemo(() => sorted.filter(v => withinFilter(v.at, filter)), [sorted, filter])

  const [selectedId, setSelectedId] = useState<string | null>(visible[0]?.id ?? null)
  const selected =
    visible.find(v => v.id === selectedId) ||
    visible[0] ||
    null
  const article = selected ? articles.find(a => a.id === selected.articleId) : null

  return (
    <div data-testid="history-page" style={{ flex: 1, height: '100%', display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', overflow: 'hidden', minWidth: 0 }}>
      {/* Timeline */}
      <div style={{ borderRight: '1px solid var(--rule-soft)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--rule-soft)' }}>
          <div className="label" style={{ marginBottom: 6 }}>Timeline</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>
            Version history
          </h2>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
            {sorted.length} {sorted.length === 1 ? 'revision' : 'revisions'} · captured on create, publish, and restore
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '10px 20px', borderBottom: '1px solid var(--rule-soft)' }}>
          {(['all', 'today', 'week'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn" data-active={filter === f} style={{ height: 22, padding: '0 8px', fontSize: 10, textTransform: 'uppercase' }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {visible.length === 0 && (
            <div style={{ padding: '32px 20px', fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
              No revisions yet. Create or publish an article to capture one.
            </div>
          )}
          <div className="list-stagger px-2">
          {visible.map((v, i) => {
            const isSel = v.id === (selected?.id ?? null)
            const isCurrent = v.label === 'current'
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                data-testid={`version-item-${v.id}`}
                className={cn(
                  'relative mb-0.5 flex w-full cursor-pointer gap-3 rounded-md border-0 px-3 py-2.5 text-left transition-all',
                  isSel ? 'bg-accent-soft text-accent-ink shadow-[var(--shadow-sm)]' : 'bg-transparent hover:bg-secondary'
                )}
              >
                <div className="flex flex-col items-center pt-1">
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-colors',
                      isCurrent ? 'bg-accent' : isSel ? 'bg-foreground' : 'border border-muted-foreground bg-background'
                    )}
                  />
                  {i < visible.length - 1 && <div className="mt-1 min-h-[18px] w-px flex-1 bg-border" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className={cn('mono text-[10px] font-semibold', isSel ? 'text-accent-ink' : 'text-foreground/85')}>
                      {v.id.toUpperCase()}
                    </span>
                    {isCurrent && (
                      <span className="mono rounded-full border border-accent px-1.5 text-[9px] uppercase tracking-wider text-accent">
                        current
                      </span>
                    )}
                    <span className="flex-1" />
                    <span className="mono text-[10px] text-muted-foreground">{fmtDate(v.at)}</span>
                  </div>
                  <div className="mb-1 text-[12px] leading-snug text-foreground/85">{v.note}</div>
                  <div className="mono text-[10px] text-muted-foreground">{v.words} words</div>
                </div>
              </button>
            )
          })}
          </div>
        </div>
      </div>

      {/* Detail */}
      {selected && article ? (
        <div style={{ overflow: 'auto', padding: '20px 24px 60px', minWidth: 0 }}>
          <div style={{ maxWidth: 700, margin: '0 auto', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--rule-soft)', marginBottom: 20 }}>
              <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                <div className="label" style={{ marginBottom: 4 }}>Revision · {selected.id.toUpperCase()}</div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2, wordBreak: 'normal', overflowWrap: 'break-word' }}>
                  {article.title}
                </h2>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
                  {fmtDateLong(selected.at)} · {selected.words} words
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  data-testid="restore-btn"
                  disabled={selected.label === 'current'}
                  onClick={() => onRestore(selected)}
                  title={selected.label === 'current' ? 'Already current' : 'Restore this revision'}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-primary bg-primary px-3.5 font-mono text-xs text-primary-foreground shadow-[var(--shadow-sm)] transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  <Icon name="restore" size={12} />
                  Restore
                </button>
              </div>
            </div>

            {/* Snapshot */}
            <div className="label mb-2">Snapshot preview</div>
            <div className="rounded-lg border border-border bg-card px-7 py-6 shadow-[var(--shadow-sm)]">
              {selected.blocks.slice(0, 6).map((b, i) => <RenderBlock key={i} block={b} />)}
              {selected.blocks.length > 6 && (
                <div className="mono mt-2 border-t border-dashed border-border pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  ⌄ {selected.blocks.length - 6} more blocks
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ maxWidth: 360, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>
            Select a revision to preview it. Revisions are captured automatically when you create or publish an article.
          </div>
        </div>
      )}
    </div>
  )
}
