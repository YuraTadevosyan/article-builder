import { useState, useMemo } from 'react'
import { Icon } from './Icon'
import { RenderBlock } from './Editor/RenderBlock'
import { fmtDate, fmtDateLong } from '../lib/utils'
import type { Article, Version } from '../types'

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
          {visible.map((v, i) => {
            const isSel = v.id === (selected?.id ?? null)
            const isCurrent = v.label === 'current'
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                data-testid={`version-item-${v.id}`}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 20px',
                  border: 0, background: isSel ? 'var(--paper-2)' : 'transparent',
                  borderLeft: `2px solid ${isSel ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer', display: 'flex', gap: 12, position: 'relative',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                  <div style={{
                    width: 10, height: 10,
                    background: isCurrent ? 'var(--accent)' : isSel ? 'var(--ink)' : 'var(--paper)',
                    border: `1px solid ${isSel || isCurrent ? 'transparent' : 'var(--ink-3)'}`,
                  }} />
                  {i < visible.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--rule-soft)', marginTop: 2, minHeight: 18 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span className="mono" style={{ fontSize: 10, color: isSel ? 'var(--ink)' : 'var(--ink-3)', fontWeight: 600 }}>
                      {v.id.toUpperCase()}
                    </span>
                    {isCurrent && (
                      <span className="mono" style={{ fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', padding: '1px 4px', border: '1px solid var(--accent)' }}>
                        current
                      </span>
                    )}
                    <span style={{ flex: 1 }} />
                    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{fmtDate(v.at)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>{v.note}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{v.words} words</div>
                </div>
              </button>
            )
          })}
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
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                <button
                  className="btn btn-primary"
                  data-testid="restore-btn"
                  disabled={selected.label === 'current'}
                  onClick={() => onRestore(selected)}
                  title={selected.label === 'current' ? 'Already current' : 'Restore this revision'}
                >
                  <Icon name="restore" size={11} />
                  Restore
                </button>
              </div>
            </div>

            {/* Snapshot */}
            <div className="label" style={{ marginBottom: 8 }}>Snapshot preview</div>
            <div style={{ border: '1px solid var(--rule-soft)', padding: '24px 28px', background: 'var(--paper-2)' }}>
              {selected.blocks.slice(0, 6).map((b, i) => <RenderBlock key={i} block={b} />)}
              {selected.blocks.length > 6 && (
                <div style={{ borderTop: '1px dashed var(--rule-soft)', paddingTop: 8, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
